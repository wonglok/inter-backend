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

export const create = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body) || {};

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  //
  // console.log(data.role);
  //

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let itemID = crypto.randomUUID();

  let Item = marshall({
    itemID: itemID || "",
    userID: data.userID || "",
    name: inbound.name || "",
    parentID: inbound.parentID || "",
    fileKey: inbound.fileKey || "",
    mime: inbound.mime || "'",
    cdn: inbound.cdn || "",
    url: inbound.url || "",
    slug: inbound.slug || "",
    type: inbound.type || "",
    datetime: new Date().getTime(),
  });

  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.FolderTable.name,
      Item: Item,
    })
  );

  let resp = {};

  {
    let result = await dynaClient.send(
      new GetItemCommand({
        TableName: Resource.FolderTable.name,
        Key: marshall({
          itemID: Item.itemID.S,
        }),
      })
    );

    resp = unmarshall(result.Item);
  }

  return { data: resp };
};

// async function checkRights({ itemID, userID, role }) {
//   let canRun = false;

//   if (role === "admin" || role === "teacher") {
//     canRun = true;
//   }

//   if (role === "student") {
//     let result = await dynaClient.send(
//       new GetItemCommand({
//         TableName: Resource.FolderTable.name,
//         Key: marshall({
//           itemID: itemID,
//         }),
//       })
//     );

//     let output = unmarshall(result.Item);

//     if (output.userID === userID) {
//       canRun = true;
//     }
//   }

//   return canRun;
// }

//
export const remove = async (event: LambdaFunctionURLEvent) => {
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

  //   let canRun = await checkRights({
  //     itemID: inbound.itemID,
  //     userID: data.userID,
  //     role: data.role,
  //   });

  //   if (!canRun) {
  //     return { error: "bad-rights" };
  //   }

  console.log(inbound.itemID);

  await dynaClient.send(
    new DeleteItemCommand({
      TableName: Resource.FolderTable.name,
      Key: {
        itemID: {
          S: inbound.itemID || "",
        },
      },
    })
  );
  //
  return {
    data: "ok",
  };
};

export const get = async (event: LambdaFunctionURLEvent) => {
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

  //   let canRun = await checkRights({
  //     itemID: inbound.itemID,
  //     userID: data.userID,
  //     role: data.role,
  //   });

  //   if (!canRun) {
  //     return { error: "bad-rights" };
  //   }

  let result = await dynaClient.send(
    new GetItemCommand({
      TableName: Resource.FolderTable.name,
      Key: marshall({
        itemID: inbound.itemID,
      }),
    })
  );

  let output = unmarshall(result.Item);

  return {
    data: output,
  };
};

//

//
export const update = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.FolderTable.name,
      Key: marshall({
        itemID: inbound.itemID,
      }),
      //

      AttributeUpdates: {
        //
        /*
itemID: itemID,
userID: data.userID,
name: inbound.name,
parentID: inbound.parentID,
slug: inbound.slug || "",
type: "folder",
datetime: new Date().getTime(),
        */

        //
        userID: {
          Value: { S: `${data.userID}` },
          Action: "PUT",
        },
        name: {
          Value: { S: `${inbound.name}` },
          Action: "PUT",
        },
        parentID: {
          Value: { S: `${inbound.parentID}` },
          Action: "PUT",
        },
        slug: {
          Value: { S: `${inbound.slug || ""}` },
          Action: "PUT",
        },
        type: {
          Value: { S: `${inbound.type || "folder"}` },
          Action: "PUT",
        },
        updatedAt: {
          Value: { S: `${new Date().toString()}` },
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
export const list = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  console.log("data.userID", data.userID);
  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  console.log("inbound.parentID", inbound.parentID);

  if (!inbound.parentID) {
    return {
      error: "miss-parentID",
    };
  }

  let allResponse = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.FolderTable.name,

      //
      ScanFilter: {
        parentID: {
          AttributeValueList: [
            //
            { S: inbound.parentID },
          ],
          ComparisonOperator: "EQ",
        },
      },
    })
  );

  console.log(allResponse.Items);

  let items = allResponse.Items.map((r) => unmarshall(r));
  console.log(items);

  return {
    data: items,
  };
};

//

// //
// export const publicList = async (event: LambdaFunctionURLEvent) => {
//   let inbound = JSON.parse(event.body);

//   // console.log(data.role);

//   if (!inbound.parentID) {
//     return { error: "miss-quid-folder" };
//   }

//   // let allResponse = await dynaClient.send(
//   //   new ScanCommand({
//   //     TableName: Resource.VideoTable.name,
//   //     // ScanFilter: {
//   //     //   parentID: {
//   //     //     AttributeValueList: [{ S: inbound.parentID }],
//   //     //     ComparisonOperator: "EQ",
//   //     //   },
//   //     // },
//   //   })
//   // );

//   // console.log(allResponse?.Items);
//   // parentID
//   // return {
//   //   data: [],
//   // };

//   //

//   //

//   let result = await dynaClient.send(
//     new ScanCommand({
//       TableName: Resource.FolderTable.name,
//       ScanFilter: {
//         userID: {
//           AttributeValueList: [{ S: `${inbound.userID || ""}` }],
//           ComparisonOperator: "EQ",
//         },
//         parentID: {
//           AttributeValueList: [{ S: `${inbound.parentID || ""}` }],
//           ComparisonOperator: "EQ",
//         },
//       },
//     })
//   );

//   let items = result.Items.map((r) => unmarshall(r));

//   console.log(items);

//   return {
//     data: items,
//   };
// };
