/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */

declare module "sst" {
  export interface Resource {
    "PostgresConnectionString": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ZeroAuthSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "replication-bucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "replication-manager": {
      "service": string
      "type": "sst.aws.Service"
    }
    "view-syncer": {
      "service": string
      "type": "sst.aws.Service"
      "url": string
    }
    "vpc": {
      "type": "sst.aws.Vpc"
    }
  }
}
/// <reference path="sst-env.d.ts" />

import "sst"
export {}