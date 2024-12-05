import { AzureChatOpenAI, ChatOpenAI } from "@langchain/openai";
import { APIGatewayProxyEventV2, LambdaFunctionURLEvent } from "aws-lambda";
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
import { ResponseStream, streamifyResponse } from "lambda-stream";
import { ChatPromptTemplate } from "@langchain/core/prompts";

//

// export const create = async (event: LambdaFunctionURLEvent) => {
//   let inbound = JSON.parse(event.body);

//   let token = event.headers["token"];
//   let { data, isValid } = await tokeToVerifiedData({ token: token });

//   //
//   // console.log(data.role);
//   //

//   if (!isValid) {
//     return { error: "bad-token" };
//   }

//   if (!["student", "teacher", "admin"].some((r) => r === data.role)) {
//     return { error: "bad-token" };
//   }

//   let itemID = crypto.randomUUID();

//   let Item = marshall({
//     itemID: itemID,
//     userID: data.userID,
//     name: inbound.name,
//     quizfolderID: inbound.quizfolderID,
//     datetime: new Date().getTime(),
//   });

//   Item.responses = {
//     //
//     L: (inbound.responses || []).map((response) => {
//       return {
//         M: marshall(response),
//       };
//     }),
//     //
//   };

//   await dynaClient.send(
//     new PutItemCommand({
//       TableName: Resource.PresentationOutlineTable,
//       Item: Item,
//     })
//   );

//   let ResponseData = {};

//   {
//     let result = await dynaClient.send(
//       new GetItemCommand({
//         TableName: Resource.PresentationOutlineTable,
//         Key: marshall({
//           itemID: Item.itemID.S,
//         }),
//       })
//     );

//     ResponseData = unmarshall(result.Item);
//   }

//   return { data: ResponseData };
// };

// async function checkRights({ itemID, userID, role }) {
//   let canRun = false;

//   if (role === "admin" || role === "teacher") {
//     canRun = true;
//   }

//   if (role === "student") {
//     let result = await dynaClient.send(
//       new GetItemCommand({
//         TableName: Resource.PresentationOutlineTable,
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

// //
// export const remove = async (event: LambdaFunctionURLEvent) => {
//   let inbound = JSON.parse(event.body);

//   let token = event.headers["token"];
//   let { data, isValid } = await tokeToVerifiedData({ token: token });

//   // console.log(data.role);

//   if (!isValid) {
//     return { error: "bad-token" };
//   }

//   if (!["student", "teacher", "admin"].some((r) => r === data.role)) {
//     return { error: "bad-token" };
//   }

//   let canRun = await checkRights({
//     itemID: inbound.itemID,
//     userID: data.userID,
//     role: data.role,
//   });

//   if (!canRun) {
//     return { error: "bad-rights" };
//   }

//   await dynaClient.send(
//     new DeleteItemCommand({
//       TableName: Resource.PresentationOutlineTable,
//       Key: marshall({
//         itemID: inbound.itemID,
//       }),
//     })
//   );
//   //
//   return {
//     data: "ok",
//   };
// };

// export const get = async (event: LambdaFunctionURLEvent) => {
//   let inbound = JSON.parse(event.body);

//   let token = event.headers["token"];
//   let { data, isValid } = await tokeToVerifiedData({ token: token });

//   // console.log(data.role);

//   if (!isValid) {
//     return { error: "bad-token" };
//   }

//   if (!["student", "teacher", "admin"].some((r) => r === data.role)) {
//     return { error: "bad-token" };
//   }

//   let canRun = await checkRights({
//     itemID: inbound.itemID,
//     userID: data.userID,
//     role: data.role,
//   });

//   if (!canRun) {
//     return { error: "bad-rights" };
//   }

//   let result = await dynaClient.send(
//     new GetItemCommand({
//       TableName: Resource.PresentationOutlineTable,
//       Key: marshall({
//         itemID: inbound.itemID,
//       }),
//     })
//   );

//   let output = unmarshall(result.Item);

//   return {
//     data: output,
//   };
// };

// //

// //
// export const update = async (event: LambdaFunctionURLEvent) => {
//   let inbound = JSON.parse(event.body);

//   let token = event.headers["token"];
//   let { data, isValid } = await tokeToVerifiedData({ token: token });

//   // console.log(data.role);

//   if (!isValid) {
//     return { error: "bad-token" };
//   }

//   if (!["student", "teacher", "admin"].some((r) => r === data.role)) {
//     return { error: "bad-token" };
//   }

//   let canRun = await checkRights({
//     itemID: inbound.itemID,
//     userID: data.userID,
//     role: data.role,
//   });

//   if (!canRun) {
//     return { error: "bad-rights" };
//   }

//   await dynaClient.send(
//     new UpdateItemCommand({
//       TableName: Resource.PresentationOutlineTable,
//       Key: marshall({
//         itemID: inbound.itemID,
//       }),
//       //

//       AttributeUpdates: {
//         //
//         userID: {
//           Value: { S: `${data.userID}` },
//           Action: "PUT",
//         },
//         quizfolderID: {
//           Value: { S: `${inbound.quizfolderID}` },
//           Action: "PUT",
//         },

//         responses: {
//           Value: {
//             L: inbound.responses.map((response) => {
//               return {
//                 M: marshall(response),
//               };
//             }),
//           },
//           Action: "PUT",
//         },
//       },
//     })
//   );

//   //
//   return {
//     data: "ok",
//   };
// };

// //
// export const list = async (event: LambdaFunctionURLEvent) => {
//   let inbound = JSON.parse(event.body);
//   let token = event.headers["token"];
//   let { data, isValid } = await tokeToVerifiedData({ token: token });

//   console.log("data.userID", data.userID);
//   // console.log(data.role);

//   if (!isValid) {
//     return { error: "bad-token" };
//   }

//   if (!["student", "teacher", "admin"].some((r) => r === data.role)) {
//     return { error: "bad-token" };
//   }

//   // let canRun = await checkRights({
//   //   itemID: inbound.itemID,
//   //   userID: data.userID,
//   //   role: data.role,
//   // });

//   // if (!canRun) {
//   //   return { error: "bad-rights" };
//   // }

//   //

//   let allResponse = await dynaClient.send(
//     new ScanCommand({
//       TableName: Resource.PresentationOutlineTable,

//       //
//       ScanFilter: {
//         userID: {
//           AttributeValueList: [{ S: `${data.userID || ""}` }],
//           ComparisonOperator: "EQ",
//         },
//         quizfolderID: {
//           AttributeValueList: [{ S: `${inbound.quizfolderID || ""}` }],
//           ComparisonOperator: "EQ",
//         },
//       },
//       //
//       //userID
//     })
//   );

//   let items = allResponse.Items.map((r) => unmarshall(r));
//   console.log(items);

//   return {
//     data: items,
//   };
// };

export const rest = async (event: LambdaFunctionURLEvent) => {
  return {
    data: [
      {
        name: "generateOutline",
        url: Resource.GenerateOutline.url,
      },
      {
        name: "generateAnswer",
        url: Resource.GenerateAnswer.url,
      },
    ],
  };
};

export const generateAnswer = streamifyResponse(
  async (
    event: APIGatewayProxyEventV2,
    responseStream: ResponseStream
  ): Promise<void> => {
    //
    console.log("event", event);

    let inbound = JSON.parse(event.body);
    let token = event.headers["token"];
    let { data, isValid } = await tokeToVerifiedData({ token: token });

    console.log("data.userID", data.userID);
    // console.log(data.role);

    if (!isValid) {
      return new Promise((resolve, _reject) => {
        responseStream.setContentType("application/json");
        responseStream.write(JSON.stringify({ error: "bad-token" }));
        setTimeout(() => {
          responseStream.end();
          resolve();
        }, 1);
      });
    }

    if (!["student", "teacher", "admin"].some((r) => r === data.role)) {
      return new Promise((resolve, _reject) => {
        responseStream.setContentType("application/json");
        responseStream.write(JSON.stringify({ error: "bad-token" }));
        setTimeout(() => {
          responseStream.end();
          resolve();
        }, 1);
      });
    }

    // console.log(event);
    responseStream.setContentType("text/plain");

    const llm = new AzureChatOpenAI({
      azureOpenAIApiDeploymentName: "gpt-4",
      azureOpenAIApiVersion: "2024-08-01-preview",
      azureOpenAIApiKey: Resource.AZURE_CHAT_KEY.value,
      azureOpenAIEndpoint: Resource.AZURE_CHAT_URL.value,
      temperature: 0.5,
    });

    inbound.data = inbound.data || [];

    let all: any = [
      {
        role: "system",
        message:
          "You are a helpful AI assistant. You are helping a student to answer his question. ",
      },
      {
        role: "assistant",
        message: "Hello, How can i help you today?",
      },
      {
        role: "human",
        message: "Sure, I have a question.",
      },

      ...inbound.data,
    ];

    const prompt = ChatPromptTemplate.fromMessages([
      ...all.map((item) => {
        return [item.role, item.message];
      }),
      // [
      //   "system",
      //   "You are a helpful AI assistant. You are helping a student to answer his question. ",
      // ],
      // //
      // [
      //   //
      //   "assistant",
      //   "Hello, How can i help you today?",
      // ],
      // //
      // [
      //   //
      //   "human",
      //   "Sure, I have a question.",
      // ],
      // //
      // [
      //   //
      //   "human",
      //   "{input}",
      // ],
    ]);

    const chain = prompt.pipe(llm);

    const stream = await chain.stream({
      input: inbound.prompt || " ",
    });

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);

      await new Promise((resolve) => {
        responseStream.write(chunk.content, resolve);
      });

      //
      if (chunks.length % 10 === 0) {
        console.log(`${chunk.content}`);
      }
    }

    let Item = marshall({
      itemID: crypto.randomUUID(),
      userID: data.userID,
      username: data.username,
      result: chunks.map((r) => r.content).join(""),
    });

    Item.data = {
      L: all.map((item) => {
        return {
          M: marshall(item),
        };
      }),
    };

    await dynaClient.send(
      new PutItemCommand({
        TableName: Resource.QuestionAnswerTable.name,
        Item: Item,
      })
    );

    responseStream.end();
  }
);

export const generateOutline = streamifyResponse(
  async (
    event: APIGatewayProxyEventV2,
    responseStream: ResponseStream
  ): Promise<void> => {
    //
    console.log("event", event);

    let inbound = JSON.parse(event.body);
    let token = event.headers["token"];
    let { data, isValid } = await tokeToVerifiedData({ token: token });

    console.log("data.userID", data.userID);
    // console.log(data.role);

    if (!isValid) {
      return new Promise((resolve, _reject) => {
        responseStream.setContentType("application/json");
        responseStream.write(JSON.stringify({ error: "bad-token" }));
        setTimeout(() => {
          responseStream.end();
          resolve();
        }, 1);
      });
    }

    if (!["student", "teacher", "admin"].some((r) => r === data.role)) {
      return new Promise((resolve, _reject) => {
        responseStream.setContentType("application/json");
        responseStream.write(JSON.stringify({ error: "bad-token" }));
        setTimeout(() => {
          responseStream.end();
          resolve();
        }, 1);
      });
    }

    // console.log(event);
    responseStream.setContentType("text/plain");

    const llm = new AzureChatOpenAI({
      azureOpenAIApiDeploymentName: "gpt-4",
      azureOpenAIApiVersion: "2024-08-01-preview",
      azureOpenAIApiKey: Resource.AZURE_CHAT_KEY.value,
      azureOpenAIEndpoint: Resource.AZURE_CHAT_URL.value,
      temperature: 0.5,
    });

    // console.log("llm", llm);

    const stream = await llm.stream(inbound.prompt || "");

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);

      await new Promise((resolve) => {
        responseStream.write(chunk.content, resolve);
      });
      //
      if (chunks.length % 10 === 0) {
        console.log(`${chunk.content}`);
      }
    }

    let Item = marshall({
      itemID: crypto.randomUUID(),
      userID: data.userID,
      username: data.username,
      prompt: inbound.prompt,
      result: chunks.map((r) => r.content).join(""),
    });

    Item.data = {
      L: inbound.data.map((item) => {
        return {
          M: marshall(item),
        };
      }),
    };

    await dynaClient.send(
      new PutItemCommand({
        TableName: Resource.PresentationOutlineTable.name,
        Item: Item,
      })
    );

    responseStream.end();
  }
);
