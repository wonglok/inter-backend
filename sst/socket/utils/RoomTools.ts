import { Resource } from "sst";

import {
  ApiGatewayManagementApiClient,
  DeleteConnectionCommand,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

// import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

// function AddMinutesToDate(date: Date, minutes: number) {
//   return new Date(date.getTime() + minutes * 60000);
// }

// let newDate = AddMinutesToDate(new Date(), 1);

// client.send(cmd);

export class RoomTools {
  gateway: ApiGatewayManagementApiClient;
  dbClient: DynamoDBClient;
  constructor() {
    this.gateway = new ApiGatewayManagementApiClient({
      endpoint: Resource.MySocket.managementEndpoint,
    });

    this.dbClient = new DynamoDBClient({
      region: this.gateway.config.region,
    });
  }

  formatJSON(data: any) {
    return JSON.stringify(data);
  }

  async listCurrentOnlineUsers({
    prune = false,
    roomSlug = "",
  }: {
    roomSlug: string | boolean;
    prune: boolean;
  }) {
    let toolset = this;
    let connections;

    if (typeof roomSlug === "string") {
      connections = await toolset.dbClient
        .send(
          new ScanCommand({
            TableName: Resource.MyConnectionTable.name,
            ScanFilter: {
              roomSlug: {
                AttributeValueList: [
                  {
                    S: roomSlug,
                  },
                ],
                ComparisonOperator: "EQ",
              },
            },
          })
        )
        .then((r: any) => {
          return (r.Items || []).map((r: any) => unmarshall(r));
        });
    } else {
      connections = await toolset.dbClient
        .send(
          new ScanCommand({
            TableName: Resource.MyConnectionTable.name,
          })
        )
        .then((r: any) => {
          return (r.Items || []).map((r: any) => unmarshall(r));
        });
    }

    let outBoundConnections = connections;

    if (prune) {
      let badOnes: any = [];
      let okOnes: any = [];
      await Promise.all(
        connections.map((conn: any) => {
          return new Promise((resolve) => {
            toolset
              .sendToConnection({
                connectionId: conn.connectionId,
                data: {
                  event: "detectOrphanSockets",
                  // list: connections,
                },
                onOK: () => {
                  okOnes.push(conn);
                  resolve(conn);
                },
                onFail: () => {
                  badOnes.push(conn);
                  resolve(conn);
                },
              })
              .catch((r) => {
                //
              });
          });
        })
      );

      outBoundConnections = okOnes;
    }

    let pp = outBoundConnections.map((conn: any) => {
      return toolset
        .sendToConnection({
          connectionId: conn.connectionId,
          data: {
            event: "onlineList",
            list: connections,
            myID: conn.connectionId,
          },
          onOK: () => {},
          onFail: () => {},
        })
        .catch((r) => {});
    });

    await Promise.all(pp);

    //
  }

  async connect({ connectionId }: { connectionId: string }) {
    await this.dbClient.send(
      new PutItemCommand({
        TableName: Resource.MyConnectionTable.name,
        Item: {
          connectionId: {
            S: connectionId,
          },
        },
      })
    );
  }
  async disconnect({ connectionId }: { connectionId: string }) {
    await this.dbClient.send(
      new DeleteItemCommand({
        TableName: Resource.MyConnectionTable.name,
        Key: {
          connectionId: {
            S: connectionId,
          },
        },
      })
    );
  }

  async sendToConnection({
    connectionId,
    data,
    onFail = () => {},
    onOK = () => {},
  }: {
    connectionId: string;
    data: any;
    onFail: () => void;
    onOK: () => void;
  }) {
    if (!connectionId) {
      throw new Error("lack connectionId");
    }
    let self = this;
    return await this.gateway
      .send(
        new PostToConnectionCommand({
          ConnectionId: `${connectionId}`,
          Data: this.formatJSON(data || null),
        })
      )
      .then((r) => {
        console.log("msg successfully sent to", connectionId);
        return onOK();
      })
      .catch(async (r) => {
        console.error(r);

        await self.disconnect({ connectionId: connectionId });

        return onFail();
      });
  }
}
