/// <reference path="./.sst/platform/config.d.ts" />

import { execSync } from 'child_process';
import fs from 'fs';

const buildZeroSchema = () => {
 execSync(`npx zero-build-schema -p "./src/schema.ts"`)
  return fs.readFileSync('./zero-schema.json', 'utf-8')
}


export default $config({
  app(input) {
    return {
      name: "hello-zero",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
   
    //creates a vpc for our Zero Server
    const vpc = new sst.aws.Vpc("MyVpc", { bastion: true, nat: "ec2" });

    //creates a database for our Zero Server
    const database = new sst.aws.Postgres("Database", { 
      vpc, 
      transform: {
      parameterGroup: {
        parameters: [
          {
            name: "rds.logical_replication",
            value: "1",
            applyMethod: "pending-reboot",
          },
          {
            name: "rds.force_ssl",
            value: "0",
            applyMethod: "pending-reboot",
          },
          {
            name: "max_connections",
            value: "1000",
            applyMethod: "pending-reboot",
          },
        ],
      }
    }});

    //creates a reusable connection string for our database
    const connectionString = $interpolate`postgres://${database.username}:${database.password}@${database.host}:${database.port}`;
    
    //creates a cluster for our Zero Server
    const cluster = new sst.aws.Cluster("ZeroCluster", { vpc });
    

    //Creates and deploys our Zero Server, if in running sst dev starts local dev server
    const service = cluster.addService("ZeroService", {
      link: [database],
      dev: { 
        //this currently does not create a pane in the dev terminal grrr
        //but it does start the cache
        //If this is not good enough i have a workaround using the SST x.DevCommand
        'autostart': true,
        'command': $interpolate`npx zero-build-schema -p "./src/schema.ts" && npx zero-cache --upstream-db ${connectionString}/${database.database} --cvr-db ${connectionString}/${database.database}_cvr --change-db ${connectionString}/${database.database}_change`,
        'url': 'http://localhost:4848',
      },
      public:  {
        ports: [ { listen: "80/http", forward: "4848/http" }],
      },
      containers: [
        {
          name: "Zero",
          image: "registry.hub.docker.com/rocicorp/zero:canary",
          environment: {
            ZERO_UPSTREAM_DB: $interpolate`${connectionString}/${database.database}`,
            ZERO_CVR_DB: $interpolate`${connectionString}/${database.database}_cvr`,
            ZERO_CHANGE_DB: $interpolate`${connectionString}/${database.database}_change`,
            ZERO_REPLICA_FILE: "zero.db",
            ZERO_SCHEMA_JSON: buildZeroSchema(),
            ZERO_AUTO_RESET: 'true',
            ZERO_LOG_LEVEL: 'debug',
          }
        }
      ],
      transform: {
        service: {
          deploymentMaximumPercent: 100,
          deploymentMinimumHealthyPercent: 0,
        }
      }
    });

    
  //Rest API for Hono Server
  const honoFunction = new sst.aws.Function('Hono', {
    handler: './api/index.handler',
    link: [database],
    url: true,
  });
  
  //Creates and deploys our react App
    const site = new sst.aws.StaticSite('HostedSite', {
      path: './',
      environment: {
        HONO_SERVER: honoFunction.url,
        ZERO_SERVER: service.url,
      },
      build: {
        command: "npm run build",
        output: "dist",
      },
      dev: {
        command: "npm run dev:ui",
        url: "http://localhost:5173",
        
      }
    });

    //Runs a short lambda function that ensures the database has the relevant tables
    const createTables = new sst.aws.Function('createTables', {
      handler: './api/createTables.handler',
      link: [database, honoFunction],
      vpc: vpc,
    });

    //whenever the connection string changes, the createTables function is called
    //to ensure the database has been seeded
    new aws.lambda.Invocation('createTables', {
      functionName: createTables.name,
      triggers: {
        connection: connectionString,
      },
      input: "{}",
      
    })
      

    return {
      ConnectionString: connectionString,
      Hono: honoFunction.url,
      Zero: service.url,
      Site: site.url,
    };
  },
});