import {
  DeleteObjectCommand,
  Event,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { LambdaFunctionURLEvent } from "aws-lambda";
import { Resource } from "sst";
import { tokeToVerifiedData } from "./auth";
import { marshall } from "@aws-sdk/util-dynamodb";

//
const s3 = new S3Client({});

export const signVideo = async (event: LambdaFunctionURLEvent) => {
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let fileKey = `uploads/video/${crypto.randomUUID()}`;
  const cmd = new PutObjectCommand({
    Key: fileKey,
    Bucket: Resource.MyUGCBucket.name,
  });

  const cdn = Resource.MyCDN.url;

  const url = await getSignedUrl(s3, cmd);

  //
  return {
    fileKey,
    cdn,
    url,
  };
};

export const removeVideo = async (event: LambdaFunctionURLEvent) => {
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let inbound = JSON.parse(event.body);
  let fileKey = inbound.fileKey;

  const cmd = new DeleteObjectCommand({
    Key: fileKey,
    Bucket: Resource.MyUGCBucket.name,
  });

  await s3.send(cmd);

  //

  // const cdn = Resource.MyCDN.url;

  // const url = await getSignedUrl(s3, cmd);

  //
  return {
    // fileKey,
    // cdn,
    // url,
  };
};

export const signGenericFile = async (event: LambdaFunctionURLEvent) => {
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let fileKey = `uploads/generic-files/${crypto.randomUUID()}`;
  const cmd = new PutObjectCommand({
    Key: fileKey,
    Bucket: Resource.MyUGCBucket.name,
  });

  const cdn = Resource.MyCDN.url;

  const url = await getSignedUrl(s3, cmd);

  //
  return {
    fileKey,
    cdn,
    url,
  };
};

export const removeGenericFile = async (event: LambdaFunctionURLEvent) => {
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let inbound = JSON.parse(event.body);
  let fileKey = inbound.fileKey;

  const cmd = new DeleteObjectCommand({
    Key: fileKey,
    Bucket: Resource.MyUGCBucket.name,
  });

  await s3.send(cmd);

  //

  // const cdn = Resource.MyCDN.url;

  // const url = await getSignedUrl(s3, cmd);

  //
  return {
    // fileKey,
    // cdn,
    // url,
  };
};
