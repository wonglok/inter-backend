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
export const createVideo = async (event: LambdaFunctionURLEvent) => {
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
    videoID: crypto.randomUUID(),
    playlistID: inbound.playlistID,
    name: inbound.name,
    cdn: inbound.cdn,
    url: inbound.url,
    fileKey: inbound.fileKey,
  };

  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.VideoTable.name,
      Item: marshall(newItem),
    })
  );

  return { data: newItem };
};

//
export const removeVideo = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.VideoTable.name,
      Key: marshall({
        videoID: inbound.videoID,
      }),
    })
  );

  //
  return {
    data: "ok",
  };
};

export const getVideo = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.VideoTable.name,
      Key: marshall({
        videoID: inbound.videoID,
      }),
    })
  );

  let output = unmarshall(result.Item);

  return {
    data: output,
  };
};

//
export const updateVideo = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.VideoTable.name,
      Key: marshall({
        videoID: inbound.videoID,
      }),
      AttributeUpdates: {
        //

        //
        playlistID: {
          Value: {
            S: inbound.playlistID,
          },
          Action: "PUT",
        },

        name: {
          Value: {
            S: inbound.name,
          },
          Action: "PUT",
        },

        slug: {
          Value: {
            S: inbound.slug || "",
          },
          Action: "PUT",
        },

        ///
        fileKey: {
          Value: {
            S: inbound.fileKey,
          },
          Action: "PUT",
        },
        cdn: {
          Value: {
            S: inbound.cdn,
          },
          Action: "PUT",
        },
        url: {
          Value: {
            S: inbound.url,
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
export const listVideo = async (event: LambdaFunctionURLEvent) => {
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
      TableName: Resource.VideoTable.name,
      ScanFilter: {
        playlistID: {
          AttributeValueList: [{ S: inbound.playlistID }],
          ComparisonOperator: "EQ",
        },
      },
    })
  );

  let items = allPlayList.Items.map((r) => unmarshall(r));
  console.log(items);

  return {
    data: items,
  };
};

export const listVideoSlug = async (event: LambdaFunctionURLEvent) => {
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

  console.log(inbound.slug);
  //
  let results = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.VideoTable.name,
      ScanFilter: {
        slug: {
          AttributeValueList: [{ S: inbound.slug }],
          ComparisonOperator: "BEGINS_WITH",
        },
      },
    })
  );

  let items = results.Items.map((r) => unmarshall(r));
  console.log(items);

  return {
    data: items,
  };
};

//
export const publicListVideos = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  // console.log(data.role);

  if (!inbound.playlistID) {
    return { error: "miss-playlist" };
  }

  // let allPlayList = await dynaClient.send(
  //   new ScanCommand({
  //     TableName: Resource.VideoTable.name,
  //     // ScanFilter: {
  //     //   playlistID: {
  //     //     AttributeValueList: [{ S: inbound.playlistID }],
  //     //     ComparisonOperator: "EQ",
  //     //   },
  //     // },
  //   })
  // );

  // console.log(allPlayList?.Items);

  // return {
  //   data: [],
  // };

  //

  let result = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.VideoTable.name,
      ScanFilter: {
        playlistID: {
          AttributeValueList: [{ S: `${inbound.playlistID || ""}` }],
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

//
//

export const countVideo = async (event: LambdaFunctionURLEvent) => {
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

  let countList = await dynaClient.send(
    new ScanCommand({
      TableName: Resource.VideoTable.name,
      Select: "COUNT",
      ScanFilter: {
        playlistID: {
          AttributeValueList: [{ S: inbound.playlistID }],
          ComparisonOperator: "EQ",
        },
      },
    })
  );

  return {
    data: countList.Count,
  };
};

//
