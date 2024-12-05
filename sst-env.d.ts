/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "AZURE_CHAT_KEY": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AZURE_CHAT_URL": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AZURE_SPEECH_KEY_1": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AZURE_SPEECH_REGION": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ClassGroupTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "ExamTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "FolderTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "GenerateAnswer": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "GenerateOutline": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "MCQuestionTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "MyApi": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "MyCDN": {
      "type": "sst.aws.Router"
      "url": string
    }
    "MyConnectionTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "MySiteGlobalTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "MySocket": {
      "managementEndpoint": string
      "type": "sst.aws.ApiGatewayWebSocket"
      "url": string
    }
    "MyUGCBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "PlayListTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "PresentationOutlineTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "QuestionAnswerTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "QuizfolderTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "REPLICATE_API_TOKEN": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "SENDGRID_API_KEY": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "UsersTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "VideoTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
  }
}
