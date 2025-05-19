/* eslint-disable */
/// <reference path="./.sst/platform/config.d.ts" />
import { execSync } from "child_process";

export default $config({
  app(input) {
    return {
      name: "hello-zero",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      region: process.env.AWS_REGION || "us-east-1",
      providers: {
        command: true,
      },
    };
  },
  async run() {
    const zeroVersion = execSync("npm show @rocicorp/zero version")
      .toString()
      .trim();

    // S3 Bucket
    const replicationBucket = new sst.aws.Bucket(`replication-bucket`);

    // VPC Configuration
    const vpc = new sst.aws.Vpc(`vpc`, {
      az: 2,
    });

    // ECS Cluster
    const cluster = new sst.aws.Cluster(`cluster`, {
      vpc,
    });

    const conn = new sst.Secret("PostgresConnectionString");
    const zeroAuthSecret = new sst.Secret("ZeroAuthSecret");

    // Common environment variables
    const commonEnv = {
      ZERO_UPSTREAM_DB: conn.value,
      ZERO_AUTH_SECRET: zeroAuthSecret.value,
      ZERO_REPLICA_FILE: "sync-replica.db",
      ZERO_IMAGE_URL: `rocicorp/zero:${zeroVersion}`,
      ZERO_CHANGE_MAX_CONNS: "3",
      ZERO_CVR_MAX_CONNS: "10",
      ZERO_UPSTREAM_MAX_CONNS: "10",
    };

    // Replication Manager Service
    const replicationManager = cluster.addService(`replication-manager`, {
      cpu: "0.5 vCPU",
      memory: "1 GB",
      architecture: "arm64",
      image: commonEnv.ZERO_IMAGE_URL,
      link: [replicationBucket],
      wait: true,
      health: {
        command: ["CMD-SHELL", "curl -f http://localhost:4849/ || exit 1"],
        interval: "5 seconds",
        retries: 3,
        startPeriod: "300 seconds",
      },
      environment: {
        ...commonEnv,
        ZERO_LITESTREAM_BACKUP_URL: $interpolate`s3://${replicationBucket.name}/backup`,
        ZERO_NUM_SYNC_WORKERS: "0",
      },
      transform: {
        target: {
          healthCheck: {
            enabled: true,
            path: "/keepalive",
            protocol: "HTTP",
            interval: 5,
            healthyThreshold: 2,
            timeout: 3,
          },
        },
      },
    });

    // View Syncer Service
    const viewSyncer = cluster.addService(
      `view-syncer`,
      {
        cpu: "1 vCPU",
        memory: "2 GB",
        architecture: "arm64",
        image: commonEnv.ZERO_IMAGE_URL,
        link: [replicationBucket],
        health: {
          command: ["CMD-SHELL", "curl -f http://localhost:4848/ || exit 1"],
          interval: "5 seconds",
          retries: 3,
          startPeriod: "300 seconds",
        },
        environment: {
          ...commonEnv,
          ZERO_CHANGE_STREAMER_MODE: "discover",
        },
        logging: {
          retention: "1 month",
        },
        loadBalancer: {
          public: true,
          //set ssl https if domain name and cert are provided
          ...(process.env.DOMAIN_NAME && process.env.DOMAIN_CERT
            ? {
                domain: {
                  name: process.env.DOMAIN_NAME,
                  dns: false,
                  cert: process.env.DOMAIN_CERT,
                },
                ports: [
                  {
                    listen: "80/http",
                    forward: "4848/http",
                  },
                  {
                    listen: "443/https",
                    forward: "4848/http",
                  },
                ],
              }
            : {
                ports: [
                  {
                    listen: "80/http",
                    forward: "4848/http",
                  },
                ],
              }),
        },
        transform: {
          target: {
            healthCheck: {
              enabled: true,
              path: "/keepalive",
              protocol: "HTTP",
              interval: 5,
              healthyThreshold: 2,
              timeout: 3,
            },
            stickiness: {
              enabled: true,
              type: "lb_cookie",
              cookieDuration: 120,
            },
            loadBalancingAlgorithmType: "least_outstanding_requests",
          },
        },
      },
      {
        // Wait for replication-manager to come up first, for breaking changes
        // to replication-manager interface.
        dependsOn: [replicationManager],
      }
    );

    // Update permissions
    new command.local.Command(
      "zero-deploy-permissions",
      {
        create: `npx zero-deploy-permissions -p ../../src/schema.ts`,
        // Run the Command on every deploy ...
        triggers: [Date.now()],
        environment: {
          ZERO_UPSTREAM_DB: commonEnv.ZERO_UPSTREAM_DB,
        },
      },
      // after the view-syncer is deployed.
      { dependsOn: viewSyncer }
    );
  },
});
