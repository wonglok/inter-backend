// import {
//   PutItemCommand,
//   DeleteItemCommand,
//   ScanCommand,
//   DynamoDBClient,
// } from "@aws-sdk/client-dynamodb";
// import {
//   ApiGatewayManagementApiClient,
//   PostToConnectionCommand,
// } from "@aws-sdk/client-apigatewaymanagementapi";

//

// import { Resource } from "sst";
import {
  //

  // BatchWriteItemCommand,
  GetItemCommand,
  // PutItemCommand,

  //
  // ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { RoomTools } from "../utils/RoomTools";
import { Resource } from "sst";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
// import {
//   ApiGatewayManagementApi,
//   GetConnectionCommand,
//   //
// } from "@aws-sdk/client-apigatewaymanagementapi";

let toolset = new RoomTools();

export async function connect(event: any) {
  const connectionId = event["requestContext"]["connectionId"];

  await toolset.connect({
    connectionId: connectionId,
  });

  return {
    //
    statusCode: 200,
    body: JSON.stringify("success"),

    //
  };
}

export async function disconnect(event: any) {
  const connectionId = event["requestContext"]["connectionId"];

  await toolset.disconnect({
    connectionId: connectionId,
  });

  return {
    //
    statusCode: 200,
    body: JSON.stringify("success"),

    //
  };
}

export async function leaveRoom(event: any) {
  const connectionId = event["requestContext"]["connectionId"];

  await toolset.disconnect({
    connectionId: connectionId,
  });

  await toolset.listCurrentOnlineUsers({ prune: true, roomSlug: false });

  return {
    //
    statusCode: 200,
    body: JSON.stringify("success"),

    //
  };
}

export async function enterRoom(event: any) {
  //
  const payload = JSON.parse(event.body);
  const roomSlug = payload.roomSlug;
  const displayName = payload.displayName;
  const avatar = payload.avatar || {};

  const connectionId = event.requestContext.connectionId;

  await toolset.dbClient.send(
    new UpdateItemCommand({
      TableName: Resource.MyConnectionTable.name,
      Key: marshall({
        connectionId: connectionId,
      }),
      AttributeUpdates: {
        displayName: {
          Value: {
            S: displayName,
          },
          Action: "PUT",
        },
        roomSlug: {
          Value: {
            S: roomSlug,
          },
          Action: "PUT",
        },
        avatar: {
          Value: {
            M: marshall(avatar),
          },
          Action: "PUT",
        },
      },
    })
  );

  await toolset.listCurrentOnlineUsers({ prune: false, roomSlug: roomSlug });

  return {
    statusCode: 200,
    body: JSON.stringify("success"),
  };
}

export async function updateAvatar(event: any) {
  //
  const payload = JSON.parse(event.body);
  const avatar = payload.avatar || {};

  const connectionId = event.requestContext.connectionId;

  const connectionObject = await toolset.dbClient
    .send(
      new GetItemCommand({
        TableName: Resource.MyConnectionTable.name,
        Key: marshall({
          connectionId: connectionId,
        }),
      })
    )
    .then((r: any) => {
      return unmarshall(r?.Item);
    });

  console.log(connectionObject, avatar);

  const roomSlug = payload.roomSlug || connectionObject?.roomSlug;
  const displayName = payload.displayName || connectionObject?.displayName;

  await toolset.dbClient.send(
    new UpdateItemCommand({
      TableName: Resource.MyConnectionTable.name,
      Key: marshall({
        connectionId: connectionId,
      }),
      AttributeUpdates: {
        displayName: {
          Value: {
            S: displayName,
          },
          Action: "PUT",
        },
        roomSlug: {
          Value: {
            S: roomSlug,
          },
          Action: "PUT",
        },
        avatar: {
          Value: {
            M: marshall({
              ...(connectionObject.avatar || {}),
              ...(avatar || {}),
            }),
          },
          Action: "PUT",
        },
      },
    })
  );

  await toolset.listCurrentOnlineUsers({ prune: false, roomSlug: roomSlug });

  return {
    statusCode: 200,
    body: JSON.stringify("success"),
  };
}

export const catchAll = () => {
  console.log("does nothing...");

  return {
    statusCode: 200,
    body: JSON.stringify("success"),
  };
};
