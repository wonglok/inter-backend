import { LambdaFunctionURLEvent } from "aws-lambda";
import {
  checkEmailTaken,
  checkUsernameTaken,
  tokeToVerifiedData,
} from "../auth";
import { Resource } from "sst";
import { dynaClient } from "../client";
import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import bcryptjs from "bcryptjs";
import * as SengGrid from "@sendgrid/mail";

export async function create(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let isTaken = await checkUsernameTaken({
    username: inbound.username,
  });

  if (isTaken) {
    return { error: "taken" };
  }

  if (!inbound.username) {
    return { error: "no-cred" };
  }
  if (!inbound.password) {
    return { error: "no-cred" };
  }

  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.UsersTable.name,
      Item: marshall({
        userID: crypto.randomUUID(),
        username: inbound.username,
        passwordHash: bcryptjs.hashSync(inbound.password, 10),
        role: "teacher",
        status: "enabled",
      }),
    })
  );

  return {
    data: "ok",
  };
}

export async function removeTeacher(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  if (
    inbound?.username === data?.username &&
    data?.username &&
    inbound?.username
  ) {
    return { error: "cannot-remove-yourself" };
  }

  if (!inbound?.username) {
    return { error: "missing-username" };
  }
  let cmdScanUser = new ScanCommand({
    TableName: Resource.UsersTable.name,
    ScanFilter: {
      username: {
        AttributeValueList: [
          //
          { S: inbound?.username || "" },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });

  let users = await dynaClient.send(cmdScanUser).then((r) => {
    return r.Items && r.Items.map((item) => unmarshall(item));
  });
  let firstUser = users[0];

  if (!firstUser) {
    return { error: "user-dont-exist" };
  }

  if (firstUser.status === "enabled") {
    return { error: "user-is-protected" };
  }

  await dynaClient.send(
    new DeleteItemCommand({
      TableName: Resource.UsersTable.name,
      Key: marshall({
        userID: firstUser.userID,
      }),
    })
  );

  // console.log(inbound, data);

  // let isTaken = await checkUsernameTaken({
  //   username: inbound.username,
  // });

  // if (isTaken) {
  //   return { error: "taken" };
  // }

  // if (!inbound.username) {
  //   return { error: "no-cred" };
  // }
  // if (!inbound.password) {
  //   return { error: "no-cred" };
  // }

  // await dynaClient.send(
  //   new PutItemCommand({
  //     TableName: Resource.UsersTable.name,
  //     Item: marshall({
  //       userID: crypto.randomUUID(),
  //       username: inbound.username,
  //       passwordHash: bcryptjs.hashSync(inbound.password, 10),
  //       role: "teacher",
  //       status: "enabled",
  //     }),
  //   })
  // );

  return {
    data,
    error: false,
  };
}

export async function taken(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let isTaken = await checkUsernameTaken({
    username: inbound.username,
  });

  if (isTaken) {
    return { error: "taken" };
  } else {
    return { data: "ok" };
  }
}

export async function list(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let cmd = new ScanCommand({
    TableName: Resource.UsersTable.name,
    //
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

  let teachers = await dynaClient
    .send(cmd)
    .then((r) => {
      return r.Items.map((obj) => {
        let clean = unmarshall(obj);
        delete clean.password;
        delete clean.passwordHash;
        return {
          userID: clean.userID,
          role: clean.role,
          username: clean.username,
          status: clean.status,
        };
      });
    })
    .catch((r) => {
      console.error(r);
      return [];
    });

  return { data: teachers, error: false };
  //
}

//

export async function updateTeacherStatus(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  console.log(data.role);
  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let cmd = new UpdateItemCommand({
    TableName: Resource.UsersTable.name,
    Key: marshall({
      userID: inbound.userID,
    }),
    AttributeUpdates: {
      status: {
        Value: {
          S: inbound.status,
        },
      },
    },
  });

  await dynaClient.send(cmd).then((r) => {});

  return { data: "ok", error: false };
  //
}

//

export async function updateTeacherPassword(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  console.log(data.role);
  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let cmd = new UpdateItemCommand({
    TableName: Resource.UsersTable.name,
    Key: marshall({
      userID: inbound.userID,
    }),
    AttributeUpdates: {
      passwordHash: {
        Value: {
          S: bcryptjs.hashSync(inbound.password, 10),
        },
      },
    },
  });

  await dynaClient.send(cmd).then((r) => {});

  return { data: "ok", error: false };
  //
}

//
export async function batchCreateStudents(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  console.log(data.role);
  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let howMany = inbound.howMany;
  let prefix = `${inbound.prefix}`;

  let creation = [];

  if (typeof howMany !== "number") {
    return {
      error: "not-number",
    };
  }

  function makeid(length) {
    let result = "";
    const characters = "ABCDEFGHJKLPQRSTUV23456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  for (let i = 0; i < howMany; i++) {
    let username = `${prefix}_${`${i}`.padStart(4, "0")}__${makeid(5)}`;
    let password = `${makeid(8)}`;

    let thisUser = {
      userID: crypto.randomUUID(),
      username: username,
      role: "student",
      status: "enabled",
      password: password,
      passwordHash: bcryptjs.hashSync(password, 10),
    };
    creation.push(thisUser);

    await new Promise((r) => setTimeout(r, 1));

    let cmd = new PutItemCommand({
      TableName: Resource.UsersTable.name,
      Item: marshall(thisUser),
    });

    await dynaClient.send(cmd);
  }

  // let cmd = new BatchWriteItemCommand({
  //   RequestItems: {
  //     [Resource.UsersTable.name]: [
  //       ...creation.map((user) => {
  //         return {
  //           PutRequest: {
  //             Item: marshall(user),
  //           },
  //         };
  //       }),
  //     ],
  //   },
  // });

  // await dynaClient.send(cmd);

  return { data: "ok", error: false };
  //
}

export async function listStudents(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  console.log(data.role);

  if (!isValid) {
    return { error: "bad-token" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let cmd = new ScanCommand({
    TableName: Resource.UsersTable.name,
    //
    ScanFilter: {
      role: {
        AttributeValueList: [
          //
          { S: "student" },
        ],
        ComparisonOperator: "EQ",
      },
    },
  });

  let students = await dynaClient
    .send(cmd)
    .then((r) => {
      return r.Items.map((obj) => {
        let clean = unmarshall(obj);
        // delete clean.password;
        delete clean.passwordHash;
        return {
          userID: clean.userID,
          role: clean.role,
          username: clean.username,
          status: clean.status,
          password: clean.password,
          studentID: clean.studentID,
        };
      });
    })
    .catch((r) => {
      console.error(r);
      return [];
    });

  return { data: students, error: false };
  //
}

export async function updateBatchStudents(event: LambdaFunctionURLEvent) {
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

  for (let user of inbound.students) {
    let Attrs = {};

    for (let attr of inbound.attributes) {
      if (attr === "status") {
        Attrs["status"] = {
          Value: {
            S: user["status"],
          },
          // Action: "PUT",
        };
      }
      if (attr === "studentID") {
        Attrs["studentID"] = {
          Value: {
            S: user["studentID"],
          },
          // Action: "PUT",
        };
      }
      if (attr === "password") {
        Attrs["password"] = {
          Value: {
            S: user["password"],
          },
          // Action: "PUT",
        };
      }
      if (attr === "username") {
        let isTaken = await checkUsernameTaken({
          username: user.username,
        });
        if (!isTaken) {
          Attrs["username"] = {
            Value: {
              S: user["username"],
            },
            // Action: "PUT",
          };
        }
      }
      if (attr === "passwordHash") {
        Attrs["passwordHash"] = {
          Value: {
            S: bcryptjs.hashSync(user["password"], 10),
          },
          // Action: "PUT",
        };
      }
    }

    await dynaClient.send(
      new UpdateItemCommand({
        TableName: Resource.UsersTable.name,
        Key: marshall({
          userID: user.userID,
        }),
        AttributeUpdates: Attrs,
      })
    );
  }

  return { data: "ok", error: false };
  //
}

export async function deleteBatchStudents(event: LambdaFunctionURLEvent) {
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

  for (let user of inbound.students) {
    if (user.status === "disabled") {
      await dynaClient.send(
        new DeleteItemCommand({
          TableName: Resource.UsersTable.name,
          Key: marshall({
            userID: user.userID,
          }),
        })
      );
    }
  }

  return { data: "ok", error: false };
  //
}

export async function provideInviteCode(event: LambdaFunctionURLEvent) {
  let inbound = JSON.parse(event.body);
  let token = event.headers["token"];
  let { data, isValid } = await tokeToVerifiedData({ token: token });

  // console.log(data.role);

  if (!isValid) {
    return { error: "bad-tokewon" };
  }
  if (!["teacher", "admin"].some((r) => r === data.role)) {
    return { error: "bad-token" };
  }

  let inviteCode = await dynaClient
    .send(
      new GetItemCommand({
        TableName: Resource.MySiteGlobalTable.name,
        Key: marshall({
          keyname: "inviteCode",
        }),
      })
    )
    .then((r) => {
      if (r.Item) {
        return unmarshall(r.Item);
      } else {
        return undefined;
      }
    });

  if (!inviteCode) {
    let ic = () => `${Math.floor(Math.random() * 10)}`;
    await dynaClient.send(
      new PutItemCommand({
        TableName: Resource.MySiteGlobalTable.name,
        Item: marshall({
          keyname: "inviteCode",
          value: `A${ic()}${ic()}${ic()}${ic()}${ic()}`,
        }),
      })
    );

    inviteCode = await dynaClient
      .send(
        new GetItemCommand({
          TableName: Resource.MySiteGlobalTable.name,
          Key: marshall({
            keyname: "inviteCode",
          }),
        })
      )
      .then((r) => {
        if (r.Item) {
          return unmarshall(r.Item);
        } else {
          return undefined;
        }
      });
  }

  return { data: inviteCode, error: false };
}

export async function refreshInviteCode(event: LambdaFunctionURLEvent) {
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

  let ic = () => `${Math.floor(Math.random() * 10)}`;
  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.MySiteGlobalTable.name,
      Item: marshall({
        keyname: "inviteCode",
        value: `A${ic()}${ic()}${ic()}${ic()}${ic()}`,
      }),
    })
  );

  let inviteCode = await dynaClient
    .send(
      new GetItemCommand({
        TableName: Resource.MySiteGlobalTable.name,
        Key: marshall({
          keyname: "inviteCode",
        }),
      })
    )
    .then((r) => {
      if (r.Item) {
        return unmarshall(r.Item);
      } else {
        return undefined;
      }
    });

  ///

  return { data: inviteCode, error: false };
}

export async function checkInviteCode(event: LambdaFunctionURLEvent) {
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

  let inviteCode = await dynaClient
    .send(
      new GetItemCommand({
        TableName: Resource.MySiteGlobalTable.name,
        Key: marshall({
          keyname: "inviteCode",
        }),
      })
    )
    .then((r) => {
      if (r.Item) {
        return unmarshall(r.Item);
      } else {
        return undefined;
      }
    });

  if (inbound.inviteCode !== inviteCode?.value) {
    return {
      error: "bad-invite",
    };
  }

  return { data: "ok", error: false };
}
//
async function emailVerifyCode({ domain, userID, email, code }) {
  // domain = domain || process.env.FRONT_END_DOMAIN;
  userID = encodeURIComponent(userID);
  code = encodeURIComponent(code);
  let html = `
            <html>
              <head>
                <title>Verify your email</title>
              </head>
              <body>
                <h1>Verify your email</h1>
                <p>Here is your verification code: <strong>${code}</strong></p>

                <p style="padding: 10px;">${domain}/student-portal/register/confirm?userID=${userID}&verifyCode=${code}</p>
                Link: <a href="${domain}/student-portal/register/confirm?userID=${userID}&verifyCode=${code}">Verify Link</a>
              </body>
            </html> 
            `;

  let msg = {
    to: email, // Change to your recipient
    from: process.env.SENDGRID_FROM, // Change to your verified sender
    subject: "Verify your email - Student Portal",
    html: html,
  };
  SengGrid.setApiKey(Resource.SENDGRID_API_KEY.value);

  await SengGrid.send(msg).catch((r) => {
    console.log(r);
  });
}

//
async function emailRestPassword({
  domain = process.env.FRONT_END_DOMAIN,
  userID,
  email,
  code,
}) {
  // domain = domain || process.env.FRONT_END_DOMAIN;
  userID = encodeURIComponent(userID);
  code = encodeURIComponent(code);
  let html = `
            <html>
              <head>
                <title>Reset Password email</title>
              </head>
              <body>
                <h1>Reset Password email</h1>
                <p>Here is your verification code: <strong>${code}</strong></p>

                <p style="padding: 10px;">${domain}/student-portal/register/confirm-password-reset?userID=${userID}&verifyCode=${code}</p>
                Link: <a href="${domain}/student-portal/register/confirm-password-reset?userID=${userID}&verifyCode=${code}">Verify Link</a>
              </body>
            </html>
            `;

  let msg = {
    to: email, // Change to your recipient
    from: process.env.SENDGRID_FROM, // Change to your verified sender
    subject: "Reset Password email.",
    html: html,
  };
  SengGrid.setApiKey(Resource.SENDGRID_API_KEY.value);

  await SengGrid.send(msg).catch((r) => {
    console.log(r);
  });
}
//

//

//

//
export async function requestRestoreByEmail(
  //
  event: LambdaFunctionURLEvent
) {
  let inbound = JSON.parse(event.body);

  let email = inbound.email;

  // let verifyCode = inbound.verifyCode;

  let userFound = await dynaClient
    .send(
      new ScanCommand({
        TableName: Resource.UsersTable.name,
        ScanFilter: {
          email: {
            AttributeValueList: [
              //
              { S: `${email}` },
            ],
            ComparisonOperator: "EQ",
          },
          // verifyCode: {
          //   AttributeValueList: [
          //     //
          //     { S: `${verifyCode}` },
          //   ],
          //   ComparisonOperator: "EQ",
          // },
          status: {
            AttributeValueList: [
              //
              { S: "enabled" },
            ],
            ComparisonOperator: "EQ",
          },
        },
      })
    )
    .then((r) => {
      if (r.Items[0]) {
        return unmarshall(r.Items[0]);
      } else {
        return false;
      }
    });

  if (!userFound) {
    return { error: "failed" };
  }

  let verifyCodeNewGen = `${Math.floor(Math.random() * 100000)}`.padStart(
    5,
    "N"
  );

  let cmd = new UpdateItemCommand({
    TableName: Resource.UsersTable.name,
    Key: marshall({
      userID: userFound.userID,
    }),
    AttributeUpdates: {
      // passwordHash: {
      //   Value: {
      //     S: bcryptjs.hashSync(inbound.password, 10),
      //   },
      // },
      // password: {
      //   Value: {
      //     S: `${inbound.password}`,
      //   },
      // },
      verifyCode: {
        Value: {
          S: verifyCodeNewGen,
        },
      },
    },
  });

  await dynaClient.send(cmd).then((r) => {});

  //
  await emailRestPassword({
    domain: process.env.FRONT_END_DOMAIN,
    userID: userFound.userID,
    email: userFound.email,
    code: verifyCodeNewGen,
  });

  // await dynaClient.send(
  //   new UpdateItemCommand({
  //     TableName: Resource.UsersTable.name,
  //     Key: marshall({
  //       userID: inbound.userID,
  //     }),
  //     AttributeUpdates: {
  //       status: {
  //         Value: {
  //           S: "enabled",
  //         },
  //       },
  //     },
  //   })
  // );

  return {
    data: {
      // userID: inbound.userID,
      // verifyCode: inbound.verifyCode,
    },
  };
} //

//

export async function requestRestoreByUsername(
  //
  event: LambdaFunctionURLEvent
) {
  let inbound = JSON.parse(event.body);

  let username = inbound.username;

  // let verifyCode = inbound.verifyCode;

  let userFound = await dynaClient
    .send(
      new ScanCommand({
        TableName: Resource.UsersTable.name,
        ScanFilter: {
          username: {
            AttributeValueList: [
              //
              { S: username },
            ],
            ComparisonOperator: "EQ",
          },
          // verifyCode: {
          //   AttributeValueList: [
          //     //
          //     { S: verifyCode },
          //   ],
          //   ComparisonOperator: "EQ",
          // },

          status: {
            AttributeValueList: [
              //
              { S: "enabled" },
            ],
            ComparisonOperator: "EQ",
          },
        },
      })
    )
    .then((r) => {
      if (r.Items[0]) {
        return unmarshall(r.Items[0]);
      } else {
        return false;
      }
    });

  if (!userFound) {
    return { error: "failed" };
  }

  let verifyCodeNewGen = `${Math.floor(Math.random() * 100000)}`.padStart(
    5,
    "N"
  );

  let cmd = new UpdateItemCommand({
    TableName: Resource.UsersTable.name,
    Key: marshall({
      userID: userFound.userID,
    }),
    AttributeUpdates: {
      // passwordHash: {
      //   Value: {
      //     S: bcryptjs.hashSync(inbound.password, 10),
      //   },
      // },
      // password: {
      //   Value: {
      //     S: `${inbound.password}`,
      //   },
      // },
      verifyCode: {
        Value: {
          S: verifyCodeNewGen,
        },
      },
    },
  });

  await emailRestPassword({
    domain: process.env.FRONT_END_DOMAIN,
    userID: userFound.userID,
    email: userFound.email,
    code: verifyCodeNewGen,
  });

  // await dynaClient.send(
  //   new UpdateItemCommand({
  //     TableName: Resource.UsersTable.name,
  //     Key: marshall({
  //       userID: inbound.userID,
  //     }),
  //     AttributeUpdates: {
  //       status: {
  //         Value: {
  //           S: "enabled",
  //         },
  //       },
  //     },
  //   })
  // );

  return {
    data: {
      // userID: inbound.userID,
      // verifyCode: inbound.verifyCode,
    },
  };
} //

export const confirmPasswordReset = async (event: LambdaFunctionURLEvent) => {
  let inbound = JSON.parse(event.body);

  let userID = inbound.userID;

  let verifyCode = inbound.verifyCode;

  let userFound = await dynaClient
    .send(
      new ScanCommand({
        TableName: Resource.UsersTable.name,
        ScanFilter: {
          userID: {
            AttributeValueList: [
              //
              { S: userID },
            ],
            ComparisonOperator: "EQ",
          },
          verifyCode: {
            AttributeValueList: [
              //
              { S: verifyCode },
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
      })
    )
    .then((r) => {
      if (r.Items[0]) {
        return unmarshall(r.Items[0]);
      } else {
        return false;
      }
    });

  if (!userFound) {
    return { error: "failed" };
  }

  let verifyCodeNewGen = `_${Math.floor(Math.random() * 100000)}_${Math.floor(
    Math.random() * 100000
  )}_${Math.floor(Math.random() * 100000)}_${Math.floor(
    Math.random() * 100000
  )}_${Math.floor(Math.random() * 100000)}_${Math.floor(
    Math.random() * 100000
  )}`.padStart(5, "N");

  let cmd = new UpdateItemCommand({
    TableName: Resource.UsersTable.name,
    Key: marshall({
      userID: userFound.userID,
    }),
    AttributeUpdates: {
      passwordHash: {
        Value: {
          S: bcryptjs.hashSync(inbound.password, 10),
        },
      },
      password: {
        Value: {
          S: `${inbound.password}`,
        },
      },

      verifyCode: {
        Value: {
          S: verifyCodeNewGen,
        },
      },
    },
  });

  // await emailRestPassword({
  //   domain: process.env.FRONT_END_DOMAIN,
  //   userID: userFound.userID,
  //   email: userFound.email,
  //   code: verifyCodeNewGen,
  // });

  // await dynaClient.send(
  //   new UpdateItemCommand({
  //     TableName: Resource.UsersTable.name,
  //     Key: marshall({
  //       userID: inbound.userID,
  //     }),
  //     AttributeUpdates: {
  //       status: {
  //         Value: {
  //           S: "enabled",
  //         },
  //       },
  //     },
  //   })
  // );

  return {
    data: {
      // userID: inbound.userID,
      // verifyCode: inbound.verifyCode,
    },
  };
};

//
export async function confirmEmailPublic(
  //
  event: LambdaFunctionURLEvent
) {
  //
  let inbound = JSON.parse(event.body);
  let userID = inbound.userID;
  let verifyCode = inbound.verifyCode;

  let userFound = await dynaClient
    .send(
      new ScanCommand({
        TableName: Resource.UsersTable.name,
        ScanFilter: {
          userID: {
            AttributeValueList: [
              //
              { S: userID },
            ],
            ComparisonOperator: "EQ",
          },
          verifyCode: {
            AttributeValueList: [
              //
              { S: verifyCode },
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
      })
    )
    .then((r) => {
      if (r.Items[0]) {
        return unmarshall(r.Items[0]);
      } else {
        return false;
      }
    });

  if (!userFound) {
    return { error: "failed" };
  }

  await dynaClient.send(
    new UpdateItemCommand({
      TableName: Resource.UsersTable.name,
      Key: marshall({
        userID: inbound.userID,
      }),
      AttributeUpdates: {
        status: {
          Value: {
            S: "enabled",
          },
        },
      },
    })
  );

  return {
    data: {
      userID: inbound.userID,
      verifyCode: inbound.verifyCode,
    },
  };
} //

// request verification
export async function requestVerifyEmailPublic(
  //
  event: LambdaFunctionURLEvent
) {
  let inbound = JSON.parse(event.body);

  let isTakenEmail = await checkEmailTaken({
    email: inbound.email,
  });

  if (!isTakenEmail) {
    return { error: "unknown-email" };
  }

  let verifyCodeNewGen = `_${Math.floor(Math.random() * 100000)}${Math.floor(
    Math.random() * 100000
  )}${Math.floor(Math.random() * 100000)}${Math.floor(
    Math.random() * 100000
  )}${Math.floor(Math.random() * 100000)}${Math.floor(
    Math.random() * 100000
  )}${Math.floor(Math.random() * 100000)}`.padStart(5, "N");

  let userFound = await dynaClient
    .send(
      new ScanCommand({
        TableName: Resource.UsersTable.name,
        ScanFilter: {
          email: {
            AttributeValueList: [
              //
              { S: inbound.email },
            ],
            ComparisonOperator: "EQ",
          },
        },
      })
    )
    .then((r) => {
      if (r.Items[0]) {
        return unmarshall(r.Items[0]);
      } else {
        return false;
      }
    });

  if (!userFound) {
    return { error: "unknown-email" };
  }

  let userID = userFound.userID;

  console.log(userFound.userID);
  await dynaClient.send(
    new UpdateItemCommand({
      TableName: Resource.UsersTable.name,
      Key: marshall({
        userID: userFound.userID,
      }),
      AttributeUpdates: {
        verifyCode: {
          Value: {
            S: verifyCodeNewGen,
          },
        },
        // passwordHash: {
        //   Value: {
        //     S: bcryptjs.hashSync(inbound.password, 10),
        //   },
        // },
      },
    })
  );

  await emailVerifyCode({
    domain: process.env.FRONT_END_DOMAIN,
    userID: userID,
    email: inbound.email,
    code: verifyCodeNewGen,
  });

  return {
    data: {
      a: [userFound.userID, verifyCodeNewGen, inbound.email],
    },
    error: false,
  };
}

export async function registerPublic(
  //
  event: LambdaFunctionURLEvent
) {
  let inbound = JSON.parse(event.body);

  let isTaken = await checkUsernameTaken({
    username: inbound.username,
  });

  let isTakenEmail = await checkEmailTaken({
    email: inbound.email,
  });

  if (isTakenEmail) {
    return { error: "email-taken" };
  }
  if (isTaken) {
    return { error: "username-taken" };
  }

  if (!inbound.username) {
    return { error: "no-username" };
  }
  if (!inbound.password) {
    return { error: "no-password" };
  }
  if (!inbound.email) {
    return { error: "no-email" };
  }

  let verifyCodeNewGen = `_${Math.floor(Math.random() * 100000)}${Math.floor(
    Math.random() * 100000
  )}${Math.floor(Math.random() * 100000)}${Math.floor(
    Math.random() * 100000
  )}${Math.floor(Math.random() * 100000)}${Math.floor(
    Math.random() * 100000
  )}`.padStart(5, "N");

  let userID: any = crypto.randomUUID();
  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.UsersTable.name,
      Item: marshall({
        userID: userID,
        username: inbound.username,
        password: inbound.password,
        email: inbound.email,
        passwordHash: bcryptjs.hashSync(inbound.password, 10),
        role: "guest",
        status: "needs-to-verify-email",
      }),
    })
  );

  console.log("ok-student");

  await emailVerifyCode({
    userID: userID,
    domain: process.env.FRONT_END_DOMAIN,
    email: inbound.email,
    code: verifyCodeNewGen,
  });

  return {
    data: "ok",
    error: false,
  };
}

export async function registerStudentUsingInviteCode(
  event: LambdaFunctionURLEvent
) {
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

  //
  let inviteCode = await dynaClient
    .send(
      new GetItemCommand({
        TableName: Resource.MySiteGlobalTable.name,
        Key: marshall({
          keyname: "inviteCode",
        }),
      })
    )
    .then((r) => {
      if (r.Item) {
        return unmarshall(r.Item);
      } else {
        return undefined;
      }
    });

  if (inbound.inviteCode !== inviteCode?.value) {
    return {
      error: "bad-invite",
    };
  }
  let isTaken = await checkUsernameTaken({
    username: inbound.username,
  });

  if (isTaken) {
    return { error: "username-taken" };
  }

  if (!inbound.username) {
    return { error: "no-cred" };
  }
  if (!inbound.password) {
    return { error: "no-cred" };
  }
  if (!inbound.studentID) {
    return { error: "no-student-id" };
  }

  await dynaClient.send(
    new PutItemCommand({
      TableName: Resource.UsersTable.name,
      Item: marshall({
        userID: crypto.randomUUID(),
        username: inbound.username,
        password: inbound.password,
        studentID: inbound.studentID,
        passwordHash: bcryptjs.hashSync(inbound.password, 10),
        role: "student",
        status: "enabled",
      }),
    })
  );

  console.log("ok-student");

  return {
    data: "ok",
    error: false,
  };
}
