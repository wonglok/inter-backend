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
export const createPlaylist = async (event: LambdaFunctionURLEvent) => {
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
    playlistID: crypto.randomUUID(),
    name: inbound.name,
  };
  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.PlayListTable.name,
      Item: marshall(newItem),
    })
  );

  return { data: newItem };
};

//
export const removePlaylist = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.PlayListTable.name,
      Key: marshall({
        playlistID: inbound.playlistID,
      }),
    })
  );

  //
  return {
    data: "ok",
  };
};

export const getPlaylist = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.PlayListTable.name,
      Key: marshall({
        playlistID: inbound.playlistID,
      }),
    })
  );

  let output = unmarshall(result.Item);

  return {
    data: output,
  };
};

//
export const updatePlaylist = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.PlayListTable.name,
      Key: {
        playlistID: {
          S: inbound.playlistID,
        },
      },

      //
      // marshall({
      //   playlistID: inbound.playlistID,
      // }),
      //

      AttributeUpdates: {
        name: {
          Value: {
            S: `${inbound.name}`,
          },
          Action: "PUT",
        },
        public: {
          Value: {
            BOOL: inbound.public ? true : false,
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
export const listPlaylist = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.PlayListTable.name,
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
export const publicListPlaylist = async (event: LambdaFunctionURLEvent) => {
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

  let allPlayList = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.PlayListTable.name,
      ScanFilter: {
        public: {
          AttributeValueList: [{ BOOL: true }],
          ComparisonOperator: "EQ",
        },
      },
    })
  );

  let items = allPlayList.Items.map((r) => unmarshall(r));

  return {
    data: items,
  };
};

//
