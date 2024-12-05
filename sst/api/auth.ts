//

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaFunctionURLEvent } from "aws-lambda";
import bcryptjs from "bcryptjs";

import jwt from "jsonwebtoken";
import md5 from "md5";
import { Resource } from "sst";
import { dynaClient } from "./client";

const JWT_SECRET = `${md5(
  `${process.env.AWS_ACCESS_KEY}${process.env.AWS_ACCESS_SECRET_KEY}`
)}`;

type UserType = {
  userID: string;
  username: string;
  passwordHash: string;
  password: string;
  role: string;
  status: "enabled" | "disabled" | "needs-to-verify-email";
};

export const needsSetup = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  console.log(inbound);

  // var token = jwt.sign({ foo: "bar" }, SECRET);

  // console.log(body);
  // console.log(SECRET);

  let cmdCount = new ScanCommand({
    TableName: Resource.UsersTable.name,
    Select: "COUNT",
    ScanFilter: {
      role: {
        AttributeValueList: [
          //
          { S: "teacher" },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });

  let needsSetup = await dynaClient.send(cmdCount).then((r) => r.Count === 0);
  if (needsSetup) {
    return {
      needsSetup,
    };
  } else {
    return {
      needsSetup: false,
    };
  }
};

export const checkUsernameTaken = async ({ username }) => {
  let cmdScanUser = new ScanCommand({
    TableName: Resource.UsersTable.name,
    Select: "COUNT",
    ScanFilter: {
      username: {
        AttributeValueList: [
          //
          { S: username },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });
  let isTaken = await dynaClient
    .send(cmdScanUser)
    .then((r) => {
      return r.Count >= 1;
    })
    .catch((r) => {
      return false;
    });
  return isTaken;
};

export const checkEmailTaken = async ({ email }) => {
  let cmdScanUser = new ScanCommand({
    TableName: Resource.UsersTable.name,
    Select: "COUNT",
    ScanFilter: {
      email: {
        AttributeValueList: [
          //
          { S: email },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });

  let isTaken = await dynaClient
    .send(cmdScanUser)
    .then((r) => {
      return r.Count >= 1;
    })
    .catch((r) => {
      return false;
    });
  return isTaken;
};

export const setupFirstUser = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event?.body);

  let cmdCount = new ScanCommand({
    TableName: Resource.UsersTable.name,
    Select: "COUNT",
    ScanFilter: {
      role: {
        AttributeValueList: [
          //
          { S: "teacher" },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });

  let needsSetup = await dynaClient.send(cmdCount).then((r) => r.Count === 0);

  if (needsSetup) {
    if (inbound.username && inbound.password) {
      // console.log(inbound.username, inbound.password);

      let cmdRegister = new PutItemCommand({
        TableName: Resource.UsersTable.name,
        Item: marshall({
          userID: crypto.randomUUID(),
          username: inbound.username,
          passwordHash: bcryptjs.hashSync(inbound.password, 10),
          role: "teacher",
          status: "enabled",
        }),
      });

      await dynaClient.send(cmdRegister);

      let cmdScanUser = new ScanCommand({
        TableName: Resource.UsersTable.name,
        ScanFilter: {
          username: {
            AttributeValueList: [
              //
              { S: inbound.username },
            ],
            ComparisonOperator: "EQ",
          },
          role: {
            AttributeValueList: [
              //
              { S: "teacher" },
            ],
            ComparisonOperator: "EQ",
          },
        },
      });

      let user = await dynaClient.send(cmdScanUser).then((r) => {
        let results = r.Items || [];
        let first = results[0];
        if (first) {
          return unmarshall(first);
        }
      });

      if (user) {
        let passwordHash = user.passwordHash;

        bcryptjs.compareSync(passwordHash);
      } else {
        throw new Error("no user");
      }

      return {
        ok: true,
      };
    } else {
      throw new Error("bad-info");
    }
  } else {
    throw new Error("already-setup");
  }
};

export const login = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event?.body);

  let cmdScanUser = new ScanCommand({
    TableName: Resource.UsersTable.name,
    ScanFilter: {
      username: {
        AttributeValueList: [
          //
          { S: inbound.username },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });

  let user: UserType = await dynaClient.send(cmdScanUser).then((r) => {
    let results = r.Items || [];
    let first = results[0];
    if (first) {
      let json: any = unmarshall(first);
      return json;
    } else {
      return false;
    }
  });

  // console.log(user);
  if (!user) {
    return {
      error: "no-user",
    };
  }

  if (user && user.status === "needs-to-verify-email") {
    return {
      error: "needs-to-verify-email",
    };
  }

  if (user && user.status === "disabled") {
    return {
      error: "user-disabled",
    };
  }

  let rr = "_" + Math.random();
  let passwordIsOK = bcryptjs.compareSync(
    inbound.password || rr,
    user.passwordHash
  );

  if (!passwordIsOK) {
    return {
      error: "bad-cred",
    };
  }

  let token = jwt.sign(
    {
      userID: user.userID,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET
  );

  return {
    data: { token },
  };
};

export let tokeToVerifiedData = async ({ token }) => {
  let tokenData = jwt.verify(token, JWT_SECRET);

  let cmdCount = new ScanCommand({
    TableName: Resource.UsersTable.name,
    Select: "COUNT",
    ScanFilter: {
      userID: {
        AttributeValueList: [
          //
          { S: tokenData.userID },
        ],
        ComparisonOperator: "EQ",
      },
      username: {
        AttributeValueList: [
          //
          { S: tokenData.username },
        ],
        ComparisonOperator: "EQ",
      },
      role: {
        AttributeValueList: [
          //
          { S: tokenData.role },
        ],
        ComparisonOperator: "EQ",
      },
      status: {
        AttributeValueList: [
          //
          { S: "enabled" },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });

  let hasOneOrMoreUser = await dynaClient
    .send(cmdCount)
    .then((r) => r.Count >= 1);

  return { isValid: hasOneOrMoreUser, data: tokenData };
};

export const getSession = async (event: LambdaFunctionURLEvent) => {
  // let inbound = JSON.parse(event?.body);

  let tokenString = event.headers.token;

  let { isValid, data } = await tokeToVerifiedData({ token: tokenString });

  if (isValid) {
    return {
      session: {
        user: {
          username: data.username,
          userID: data.userID,
          role: data.role,
        },
      },
    };
  } else {
    throw new Error("bad-token-error");
  }
};
