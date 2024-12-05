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
export const createMCQuestion = async (event: LambdaFunctionURLEvent) => {
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

  let newItem = {
    mcquestionID: crypto.randomUUID(),

    quizfolderID: inbound.quizfolderID,

    question: inbound.question,
    a: `${inbound.a}`,
    b: `${inbound.b}`,
    c: `${inbound.c}`,
    d: `${inbound.d}`,
    answer: `${inbound.answer}`,
  };

  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.MCQuestionTable.name,
      Item: marshall(newItem),
    })
  );

  return { data: newItem };
};

//
export const removeMCQuestion = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.MCQuestionTable.name,
      Key: marshall({
        mcquestionID: inbound.mcquestionID,
      }),
    })
  );

  //
  return {
    data: "ok",
  };
};

export const getMCQuestion = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.MCQuestionTable.name,
      Key: marshall({
        mcquestionID: inbound.mcquestionID,
      }),
    })
  );

  let output = unmarshall(result.Item);

  return {
    data: output,
  };
};

//
export const updateMCQuestion = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.MCQuestionTable.name,
      Key: marshall({
        mcquestionID: inbound.mcquestionID,
      }),
      AttributeUpdates: {
        question: {
          Value: {
            S: inbound.question,
          },
          Action: "PUT",
        },
        answer: {
          Value: {
            S: inbound.answer,
          },
          Action: "PUT",
        },
        a: {
          Value: {
            S: inbound.a,
          },
          Action: "PUT",
        },
        b: {
          Value: {
            S: inbound.b,
          },
          Action: "PUT",
        },
        c: {
          Value: {
            S: inbound.c,
          },
          Action: "PUT",
        },
        d: {
          Value: {
            S: inbound.d,
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
export const listMCQuestion = async (event: LambdaFunctionURLEvent) => {
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

  let allPlayList = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.MCQuestionTable.name,

      //
      ScanFilter: {
        quizfolderID: {
          AttributeValueList: [{ S: `${inbound.quizfolderID || ""}` }],
          ComparisonOperator: "EQ",
        },
      },
      //
      //quizfolderID
    })
  );

  let items = allPlayList.Items.map((r) => unmarshall(r));
  console.log(items);

  return {
    data: items,
  };
};

//

//
export const publicListMCQuestion = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  // console.log(data.role);

  if (!inbound.quizfolderID) {
    return { error: "miss-quid-folder" };
  }

  // let allPlayList = await dynaClient.send(
  //   new ScanCommand({
  //     TableName: Resource.VideoTable.name,
  //     // ScanFilter: {
  //     //   quizfolderID: {
  //     //     AttributeValueList: [{ S: inbound.quizfolderID }],
  //     //     ComparisonOperator: "EQ",
  //     //   },
  //     // },
  //   })
  // );

  // console.log(allPlayList?.Items);
  // quizfolderID
  // return {
  //   data: [],
  // };

  //

  //

  let result = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.MCQuestionTable.name,
      ScanFilter: {
        quizfolderID: {
          AttributeValueList: [
            //
            {
              //
              S: `${inbound.quizfolderID || ""}`,
            },
          ],
          ComparisonOperator: "EQ",
        },
      },
    })
  );

  let items = result.Items.map((r) => unmarshall(r));

  console.log(items);

  return {
    data: items,
  };
};
