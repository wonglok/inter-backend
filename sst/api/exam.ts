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

const CollectionTableName = Resource.ExamTable.name;

//

export const create = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  //
  // console.log(data.role);
  //

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["guest", "student", "teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let examID = crypto.randomUUID();

  let Item = marshall({
    examID: examID,
    userID: data.userID,
    name: inbound.name,
    quizfolderID: inbound.quizfolderID,
    datetime: new Date().getTime(),
  });

  Item.responses = {
    //
    L: (inbound.responses || []).map((response) => {
      return {
        M: marshall(response),
      };
    }),
    //
  };

  await dynaClient.send(
    new PutItemCommand({
      TableName: CollectionTableName,
      Item: Item,
    })
  );

  let ResponseData = {};

  {
    let result = await dynaClient.send(
      new GetItemCommand({
        TableName: CollectionTableName,
        Key: marshall({
          examID: Item.examID.S,
        }),
      })
    );

    ResponseData = unmarshall(result.Item);
  }

  return { data: ResponseData };
};

async function checkRights({ examID, userID, role }) {
  let canRun = false;

  if (role === "admin" || role === "teacher") {
    canRun = true;
  }

  if (role === "student") {
    let result = await dynaClient.send(
      new GetItemCommand({
        TableName: CollectionTableName,
        Key: marshall({
          examID: examID,
        }),
      })
    );

    let output = unmarshall(result.Item);

    if (output.userID === userID) {
      canRun = true;
    }
  }

  return canRun;
}

//
export const remove = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["guest", "student", "teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let canRun = await checkRights({
    examID: inbound.examID,
    userID: data.userID,
    role: data.role,
  });

  if (!canRun) {
    return { error: "bad-rights" };
  }

  await dynaClient.send(
    new DeleteItemCommand({
      TableName: CollectionTableName,
      Key: marshall({
        examID: inbound.examID,
      }),
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

  if (!["guest", "student", "teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let canRun = await checkRights({
    examID: inbound.examID,
    userID: data.userID,
    role: data.role,
  });

  if (!canRun) {
    return { error: "bad-rights" };
  }

  let result = await dynaClient.send(
    new GetItemCommand({
      TableName: CollectionTableName,
      Key: marshall({
        examID: inbound.examID,
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

  if (!["guest", "student", "teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let canRun = await checkRights({
    examID: inbound.examID,
    userID: data.userID,
    role: data.role,
  });

  if (!canRun) {
    return { error: "bad-rights" };
  }

  await dynaClient.send(
    new UpdateItemCommand({
      TableName: CollectionTableName,
      Key: marshall({
        examID: inbound.examID,
      }),
      //

      AttributeUpdates: {
        //
        userID: {
          Value: { S: `${data.userID}` },
          Action: "PUT",
        },
        quizfolderID: {
          Value: { S: `${inbound.quizfolderID}` },
          Action: "PUT",
        },

        responses: {
          Value: {
            L: inbound.responses.map((response) => {
              return {
                M: marshall(response),
              };
            }),
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
export const list = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  console.log("data.userID", data.userID);
  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }

  if (!["guest", "student", "teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  // let canRun = await checkRights({
  //   examID: inbound.examID,
  //   userID: data.userID,
  //   role: data.role,
  // });

  // if (!canRun) {
  //   return { error: "bad-rights" };
  // }

  //

  let allResponse = await dynaClient.send(
    new ScanCommand({
      TableName: CollectionTableName,

      //
      ScanFilter: {
        userID: {
          AttributeValueList: [{ S: `${data.userID || ""}` }],
          ComparisonOperator: "EQ",
        },
        quizfolderID: {
          AttributeValueList: [{ S: `${inbound.quizfolderID || ""}` }],
          ComparisonOperator: "EQ",
        },
      },
      //
      //userID
    })
  );

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

//   if (!inbound.quizfolderID) {
//     return { error: "miss-quid-folder" };
//   }

//   // let allResponse = await dynaClient.send(
//   //   new ScanCommand({
//   //     TableName: Resource.VideoTable.name,
//   //     // ScanFilter: {
//   //     //   quizfolderID: {
//   //     //     AttributeValueList: [{ S: inbound.quizfolderID }],
//   //     //     ComparisonOperator: "EQ",
//   //     //   },
//   //     // },
//   //   })
//   // );

//   // console.log(allResponse?.Items);
//   // quizfolderID
//   // return {
//   //   data: [],
//   // };

//   //

//   //

//   let result = await dynaClient.send(
//     new ScanCommand({
//       TableName: CollectionTableName,
//       ScanFilter: {
//         userID: {
//           AttributeValueList: [{ S: `${inbound.userID || ""}` }],
//           ComparisonOperator: "EQ",
//         },
//         quizfolderID: {
//           AttributeValueList: [{ S: `${inbound.quizfolderID || ""}` }],
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
