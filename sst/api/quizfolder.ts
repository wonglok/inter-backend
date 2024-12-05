import { LambdaFunctionURLEvent } from "aws-lambda";
import { tokeToVerifiedData } from "./auth";
import { dynaClient } from "./client";
import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

//
export const createQuizfolder = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  ////////

  //

  let newItem = {
    quizfolderID: crypto.randomUUID(),
    name: inbound.name,
  };
  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.QuizfolderTable.name,
      Item: marshall(newItem),
    })
  );

  return { data: newItem };
};

//
export const removeQuizfolder = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  //

  await dynaClient.send(
    new DeleteItemCommand({
      TableName: Resource.QuizfolderTable.name,
      Key: marshall({
        quizfolderID: inbound.quizfolderID,
      }),
    })
  );

  //
  return {
    data: "ok",
  };
};

export const getQuizfolder = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let result = await dynaClient.send(
    new GetItemCommand({
      TableName: Resource.QuizfolderTable.name,
      Key: marshall({
        quizfolderID: inbound.quizfolderID,
      }),
    })
  );

  let output = unmarshall(result.Item);

  return {
    data: output,
  };
};

//
export const updateQuizfolder = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  await dynaClient.send(
    new UpdateItemCommand({
      TableName: Resource.QuizfolderTable.name,
      Key: marshall({
        quizfolderID: inbound.quizfolderID,
      }),
      AttributeUpdates: {
        name: {
          Value: {
            S: inbound.name,
          },
          Action: "PUT",
        },
      },
    })
  );

  //
  return {
    data: "ok",
  };
};

//
export const listQuizfolder = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  //

  let result = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.QuizfolderTable.name,
    })
  );

  let items = result.Items.map((r) => unmarshall(r));
  console.log(items);

  return {
    data: items,
  };
};

//

export const publicListQuizfolder = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);
  // let token = event.headers["token"];
  // let { data, isValid } = await tokeToVerifiedData({ token: token });

  // // console.log(data.role);

  // if (!isValid) {
  //   return { error: "bad-token" };
  // }

  // if (!["teacher", "admin"].some((r) => r === data.role)) {
  //   return { error: "bad-token" };
  // }

  // //

  let result = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.QuizfolderTable.name,
      // ScanFilter: {
      //   public: {
      //     AttributeValueList: [{ BOOL: true }],
      //     ComparisonOperator: "EQ",
      //   },
      // },
    })
  );

  let items = result.Items.map((r) => unmarshall(r));
  console.log(items);

  return {
    data: items,
  };
};

//
