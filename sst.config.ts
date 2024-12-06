/// <reference path="./.sst/platform/config.d.ts" />

// import { link } from "fs";

const REGION = "ap-southeast-1"; // singapore
const AWS_PROFILE = "personal";
const APP_NAME = "inter-site-website";
const FRONT_END_DOMAIN = `https://inter-site.com`;
const FRONT_END_LOCALHOST = `http://localhost:3000`;
const SENDGRID_FROM = `lok@inter-site.com`;

export default $config({
  app(input) {
    return {
      name: APP_NAME,
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: REGION,
          profile: AWS_PROFILE,
        },
      },
    };
  },
  async run() {
    //

    const mySiteGlobalTable = new sst.aws.Dynamo("MySiteGlobalTable", {
      fields: {
        keyname: "string",
      },
      primaryIndex: { hashKey: "keyname" },
    });

    // key value

    const myConnectionTable = new sst.aws.Dynamo("MyConnectionTable", {
      fields: {
        connectionId: "string",
      },
      primaryIndex: { hashKey: "connectionId" },
    });

    //////////////////

    //////////////////
    const UsersTable = new sst.aws.Dynamo("UsersTable", {
      fields: {
        userID: "string", // uuid
        //
        // username
        // userpassword
        // role
        // classGroupUUID
      },
      primaryIndex: { hashKey: "userID" },
    });

    const FolderTable = new sst.aws.Dynamo("FolderTable", {
      fields: {
        itemID: "string",
      },
      primaryIndex: { hashKey: "itemID" },
    });

    //

    //////////////////

    //////////////////

    //////////////////

    const myUGCBucket = new sst.aws.Bucket("MyUGCBucket", {
      access: "public",
      cors: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: ["DELETE", "GET", "HEAD", "POST", "PUT"],
        exposeHeaders: ["E-Tag"],
        maxAge: "3600 seconds",
      },
    });

    const api = new sst.aws.ApiGatewayV2("MyApi", {});

    const myCDN = new sst.aws.Router("MyCDN", {
      routes: {
        "/*": {
          bucket: myUGCBucket,
        },
        //
        // '/bucket/*': {
        //     bucket: myUGCBucket,
        // },
        //
      },
    });

    let resources = {
      myUGCBucket,
      myCDN,
      api,
      UsersTable,
      FolderTable,
    };

    //////// ROUTES //////////

    api.route("GET /api", {
      handler: "sst/api/welcome.home",
    });

    api.route("POST /api/auth/needsSetup", {
      handler: "sst/api/auth.needsSetup",
      link: [UsersTable],
    });

    api.route("POST /api/auth/setupFirstUser", {
      handler: "sst/api/auth.setupFirstUser",
      link: [UsersTable],
    });

    api.route("POST /api/auth/login", {
      handler: "sst/api/auth.login",
      link: [UsersTable],
    });

    api.route("POST /api/auth/getSession", {
      handler: "sst/api/auth.getSession",
      link: [UsersTable],
    });

    //////// teacher page

    api.route("POST /api/admin/accounts/create", {
      handler: "sst/api/admin/accounts.create",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/taken", {
      handler: "sst/api/admin/accounts.taken",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/list", {
      handler: "sst/api/admin/accounts.list",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/updateAdminStatus", {
      handler: "sst/api/admin/accounts.updateAdminStatus",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/updateAdminPassword", {
      handler: "sst/api/admin/accounts.updateAdminPassword",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/batchCreateStudents", {
      handler: "sst/api/admin/accounts.batchCreateStudents",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/listStudents", {
      handler: "sst/api/admin/accounts.listStudents",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/updateBatchStudents", {
      handler: "sst/api/admin/accounts.updateBatchStudents",
      link: [UsersTable],
    });

    api.route("POST /api/admin/accounts/deleteBatchStudents", {
      handler: "sst/api/admin/accounts.deleteBatchStudents",
      link: [UsersTable],
    });

    const SENDGRID_API_KEY = new sst.Secret("SENDGRID_API_KEY");

    api.route("POST /api/admin/accounts/confirmEmailPublic", {
      handler: "sst/api/admin/accounts.confirmEmailPublic",
      link: [UsersTable, SENDGRID_API_KEY],
    });

    let getDomain = () => {
      if ($app.stage === "production") {
        return FRONT_END_DOMAIN;
      }
      if ($app.stage === "staging") {
        return FRONT_END_DOMAIN;
      }

      return FRONT_END_LOCALHOST;
    };

    // console.log("getDomain", getDomain());

    api.route("POST /api/admin/accounts/requestVerifyEmailPublic", {
      handler: "sst/api/admin/accounts.requestVerifyEmailPublic",
      link: [UsersTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });

    api.route("POST /api/admin/accounts/registerPublic", {
      handler: "sst/api/admin/accounts.registerPublic",
      link: [UsersTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });

    api.route("POST /api/admin/accounts/requestRestoreByEmail", {
      handler: "sst/api/admin/accounts.requestRestoreByEmail",
      link: [UsersTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });
    api.route("POST /api/admin/accounts/requestRestoreByUsername", {
      handler: "sst/api/admin/accounts.requestRestoreByUsername",
      link: [UsersTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });
    api.route("POST /api/admin/accounts/confirmPasswordReset", {
      handler: "sst/api/admin/accounts.confirmPasswordReset",
      link: [UsersTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });

    //
    //
    api.route("POST /api/admin/accounts/removeAdmin", {
      handler: "sst/api/admin/accounts.removeAdmin",
      link: [UsersTable],
    });

    //////////////////
    //////////////////
    //////////////////
    //////////////////

    //////////////////
    //////////////////
    //////////////////
    //////////////////

    //////////////////
    //////////////////
    //////////////////
    //////////////////
    //////////////////
    //////////////////

    //////////////////

    await import("./sst/api/file-manager/routes.js").then(async (mod) => {
      await mod.importRoutes({ resources });
    });

    //////////////////

    const socket = new sst.aws.ApiGatewayWebSocket("MySocket", {
      accessLog: false,
    });

    const getRoomLinks = () => [myConnectionTable, socket];

    socket.route("$connect", {
      handler: "sst/socket/RoomService/RoomService.connect",
      link: getRoomLinks(),
      logging: false,
    });

    socket.route("$disconnect", {
      handler: "sst/socket/RoomService/RoomService.disconnect",
      link: getRoomLinks(),
      logging: false,
    });

    socket.route("$default", {
      handler: "sst/socket/RoomService/RoomService.catchAll",
      link: getRoomLinks(),
      logging: false,
    });

    socket.route("enterRoom", {
      handler: "sst/socket/RoomService/RoomService.enterRoom",
      link: getRoomLinks(),
      logging: false,
    });

    socket.route("leaveRoom", {
      handler: "sst/socket/RoomService/RoomService.leaveRoom",
      link: getRoomLinks(),
      logging: false,
    });

    socket.route("updateAvatar", {
      handler: "sst/socket/RoomService/RoomService.updateAvatar",
      link: getRoomLinks(),
      logging: false,
    });

    //

    return {
      // GenerateAnswer: GenerateAnswerFnc.url,
      // GenerateOutline: GenerateOutline.url,
    };
  },
});
