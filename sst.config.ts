/// <reference path="./.sst/platform/config.d.ts" />

// import { link } from "fs";

const REGION = "ap-southeast-1"; // sydney
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

    const ClassGroupTable = new sst.aws.Dynamo("ClassGroupTable", {
      fields: {
        classID: "string",
        // group ifno
      },
      primaryIndex: { hashKey: "classID" },
    });

    const VideoTable = new sst.aws.Dynamo("VideoTable", {
      fields: {
        videoID: "string",
        // group ifno
      },
      primaryIndex: { hashKey: "videoID" },
    });

    const ExamTable = new sst.aws.Dynamo("ExamTable", {
      fields: {
        examID: "string",
      },
      primaryIndex: { hashKey: "examID" },
    });

    const FolderTable = new sst.aws.Dynamo("FolderTable", {
      fields: {
        itemID: "string",
      },
      primaryIndex: { hashKey: "itemID" },
    });

    const PresentationOutlineTable = new sst.aws.Dynamo(
      "PresentationOutlineTable",
      {
        fields: {
          itemID: "string",
        },
        primaryIndex: { hashKey: "itemID" },
      }
    );

    const QuestionAnswerTable = new sst.aws.Dynamo("QuestionAnswerTable", {
      fields: {
        itemID: "string",
      },
      primaryIndex: { hashKey: "itemID" },
    });

    const PlayListTable = new sst.aws.Dynamo("PlayListTable", {
      fields: {
        playlistID: "string",
        // group ifno
      },
      primaryIndex: { hashKey: "playlistID" },
    });

    const QuizfolderTable = new sst.aws.Dynamo("QuizfolderTable", {
      fields: {
        quizfolderID: "string",
        // group ifno
      },
      primaryIndex: { hashKey: "quizfolderID" },
    });

    const MCQuestionTable = new sst.aws.Dynamo("MCQuestionTable", {
      fields: {
        mcquestionID: "string",
        // group ifno
      },
      primaryIndex: { hashKey: "mcquestionID" },
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

    api.route("POST /api/teacher/accounts/create", {
      handler: "sst/api/teacher/accounts.create",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/taken", {
      handler: "sst/api/teacher/accounts.taken",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/list", {
      handler: "sst/api/teacher/accounts.list",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/updateTeacherStatus", {
      handler: "sst/api/teacher/accounts.updateTeacherStatus",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/updateTeacherPassword", {
      handler: "sst/api/teacher/accounts.updateTeacherPassword",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/batchCreateStudents", {
      handler: "sst/api/teacher/accounts.batchCreateStudents",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/listStudents", {
      handler: "sst/api/teacher/accounts.listStudents",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/updateBatchStudents", {
      handler: "sst/api/teacher/accounts.updateBatchStudents",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/deleteBatchStudents", {
      handler: "sst/api/teacher/accounts.deleteBatchStudents",
      link: [UsersTable],
    });

    api.route("POST /api/teacher/accounts/provideInviteCode", {
      handler: "sst/api/teacher/accounts.provideInviteCode",
      link: [UsersTable, mySiteGlobalTable],
    });

    api.route("POST /api/teacher/accounts/refreshInviteCode", {
      handler: "sst/api/teacher/accounts.refreshInviteCode",
      link: [UsersTable, mySiteGlobalTable],
    });

    api.route("POST /api/teacher/accounts/checkInviteCode", {
      handler: "sst/api/teacher/accounts.checkInviteCode",
      link: [UsersTable, mySiteGlobalTable],
    });

    api.route("POST /api/teacher/accounts/registerStudentUsingInviteCode", {
      handler: "sst/api/teacher/accounts.registerStudentUsingInviteCode",
      link: [UsersTable, mySiteGlobalTable],
    });

    const SENDGRID_API_KEY = new sst.Secret("SENDGRID_API_KEY");

    api.route("POST /api/teacher/accounts/confirmEmailPublic", {
      handler: "sst/api/teacher/accounts.confirmEmailPublic",
      link: [UsersTable, mySiteGlobalTable, SENDGRID_API_KEY],
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

    console.log("getDomain", getDomain());

    api.route("POST /api/teacher/accounts/requestVerifyEmailPublic", {
      handler: "sst/api/teacher/accounts.requestVerifyEmailPublic",
      link: [UsersTable, mySiteGlobalTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });

    api.route("POST /api/teacher/accounts/registerPublic", {
      handler: "sst/api/teacher/accounts.registerPublic",
      link: [UsersTable, mySiteGlobalTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });

    api.route("POST /api/teacher/accounts/requestRestoreByEmail", {
      handler: "sst/api/teacher/accounts.requestRestoreByEmail",
      link: [UsersTable, mySiteGlobalTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });
    api.route("POST /api/teacher/accounts/requestRestoreByUsername", {
      handler: "sst/api/teacher/accounts.requestRestoreByUsername",
      link: [UsersTable, mySiteGlobalTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });
    api.route("POST /api/teacher/accounts/confirmPasswordReset", {
      handler: "sst/api/teacher/accounts.confirmPasswordReset",
      link: [UsersTable, mySiteGlobalTable, SENDGRID_API_KEY],
      environment: {
        FRONT_END_DOMAIN: getDomain(), // FRONT_END_DOMAIN,
        SENDGRID_FROM: SENDGRID_FROM,
      },
    });

    //
    //
    api.route("POST /api/teacher/accounts/removeTeacher", {
      handler: "sst/api/teacher/accounts.removeTeacher",
      link: [UsersTable],
    });

    // let encode = new sst.aws.Function("VideoEncoder", {
    //   url: true,
    //   handler: "sst/api/video/transcoder.handler",
    //   link: [UsersTable, myUGCBucket, myCDN],
    //   memory: "2 GB",
    //   timeout: "15 minutes",
    //   nodejs: { install: ["ffmpeg-static"] },
    // });

    // api.route("POST /api/video/transcoder/handler", {
    //   handler: "sst/api/video/transcoder.handler",
    //   link: [UsersTable, myUGCBucket, myCDN],
    //   memory: "2 GB",
    //   timeout: "15 minutes",
    //   nodejs: { install: ["ffmpeg-static"] },
    // });
    //////////////////
    //////////////////

    //

    //

    //////////////////
    //////////////////
    // const REPLICATE_API_TOKEN = new sst.Secret("REPLICATE_API_TOKEN");
    // const AZURE_SPEECH_KEY_1 = new sst.Secret("AZURE_SPEECH_KEY_1");
    // const AZURE_SPEECH_REGION = new sst.Secret("AZURE_SPEECH_REGION");

    // // const SpeechAssessmentTable = new sst.aws.Dynamo("SpeechAssessmentTable", {
    // //   fields: {
    // //     itemID: "string",
    // //     // group ifno
    // //   },
    // //   primaryIndex: { hashKey: "itemID" },
    // // });

    // api.route("POST /api/audio/speechAssessmentCheck", {
    //   handler: "sst/api/audio.speechAssessmentCheck",
    //   link: [
    //     //
    //     REPLICATE_API_TOKEN,
    //     AZURE_SPEECH_KEY_1,
    //     AZURE_SPEECH_REGION,

    //     // SpeechAssessmentTable,
    //   ],
    // });

    // api.route("POST /api/audio/speechAssessment", {
    //   handler: "sst/api/audio.speechAssessment",
    //   link: [
    //     //
    //     REPLICATE_API_TOKEN,
    //     AZURE_SPEECH_KEY_1,
    //     AZURE_SPEECH_REGION,
    //     // SpeechAssessmentTable,
    //   ],
    //   timeout: "900 seconds",
    // });

    // api.route("POST /api/audio/speechToText", {
    //   handler: "sst/api/audio.speechToText",
    //   link: [REPLICATE_API_TOKEN],
    // });

    // api.route("POST /api/audio/speechAnalysis", {
    //   handler: "sst/api/audio.speechAnalysis",
    //   link: [REPLICATE_API_TOKEN, myUGCBucket, api],
    // });

    // api.route("POST /api/audio/hook", {
    //   handler: "sst/api/audio.hook",
    //   link: [REPLICATE_API_TOKEN, myUGCBucket, myCDN],
    // });

    //////////////////

    api.route("GET /api/files/signVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/files.signVideo",
    });

    api.route("POST /api/files/removeVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/files.removeVideo",
    });

    //////////////////

    api.route("GET /api/files/signGenericFile", {
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        VideoTable,
        PlayListTable,
        FolderTable,
      ],
      handler: "sst/api/files.signGenericFile",
    });

    api.route("POST /api/files/removeGenericFile", {
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        VideoTable,
        PlayListTable,
        FolderTable,
      ],
      handler: "sst/api/files.removeGenericFile",
    });

    //////////////////
    //////////////////
    //////////////////
    //////////////////

    //////////////////
    // Quizfolder
    //////////////////

    api.route("POST /api/quizfolder/createQuizfolder", {
      link: [myUGCBucket, myCDN, api, UsersTable, QuizfolderTable],
      handler: "sst/api/quizfolder.createQuizfolder",
    });
    api.route("POST /api/quizfolder/removeQuizfolder", {
      link: [myUGCBucket, myCDN, api, UsersTable, QuizfolderTable],
      handler: "sst/api/quizfolder.removeQuizfolder",
    });
    api.route("POST /api/quizfolder/listQuizfolder", {
      link: [myUGCBucket, myCDN, api, UsersTable, QuizfolderTable],
      handler: "sst/api/quizfolder.listQuizfolder",
    });
    api.route("POST /api/quizfolder/getQuizfolder", {
      link: [myUGCBucket, myCDN, api, UsersTable, QuizfolderTable],
      handler: "sst/api/quizfolder.getQuizfolder",
    });
    api.route("POST /api/quizfolder/updateQuizfolder", {
      link: [myUGCBucket, myCDN, api, UsersTable, QuizfolderTable],
      handler: "sst/api/quizfolder.updateQuizfolder",
    });

    api.route("POST /api/quizfolder/publicListQuizfolder", {
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        VideoTable,
        PlayListTable,
        QuizfolderTable,
      ],
      handler: "sst/api/quizfolder.publicListQuizfolder",
    });

    //////////////////
    // Quizfolder
    //////////////////

    api.route("POST /api/mcquestion/createMCQuestion", {
      link: [myUGCBucket, myCDN, api, UsersTable, MCQuestionTable],
      handler: "sst/api/mcquestion.createMCQuestion",
    });
    api.route("POST /api/mcquestion/removeMCQuestion", {
      link: [myUGCBucket, myCDN, api, UsersTable, MCQuestionTable],
      handler: "sst/api/mcquestion.removeMCQuestion",
    });
    api.route("POST /api/mcquestion/listMCQuestion", {
      link: [myUGCBucket, myCDN, api, UsersTable, MCQuestionTable],
      handler: "sst/api/mcquestion.listMCQuestion",
    });
    api.route("POST /api/mcquestion/getMCQuestion", {
      link: [myUGCBucket, myCDN, api, UsersTable, MCQuestionTable],
      handler: "sst/api/mcquestion.getMCQuestion",
    });
    api.route("POST /api/mcquestion/updateMCQuestion", {
      link: [myUGCBucket, myCDN, api, UsersTable, MCQuestionTable],
      handler: "sst/api/mcquestion.updateMCQuestion",
    });

    api.route("POST /api/mcquestion/publicListMCQuestion", {
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        VideoTable,
        PlayListTable,
        MCQuestionTable,
        PresentationOutlineTable,
      ],
      handler: "sst/api/mcquestion.publicListMCQuestion",
    });

    //////////////////
    // Playlist
    //////////////////

    api.route("POST /api/playlist/createPlaylist", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/playlist.createPlaylist",
    });
    api.route("POST /api/playlist/removePlaylist", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/playlist.removePlaylist",
    });
    api.route("POST /api/playlist/listPlaylist", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/playlist.listPlaylist",
    });
    api.route("POST /api/playlist/getPlaylist", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/playlist.getPlaylist",
    });
    api.route("POST /api/playlist/updatePlaylist", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/playlist.updatePlaylist",
    });

    //

    api.route("POST /api/playlist/publicListPlaylist", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/playlist.publicListPlaylist",
    });

    //////////////////
    //////////////////
    //////////////////
    //////////////////

    //////////////////
    // Exam
    //////////////////
    api.route("POST /api/exam/create", {
      handler: "sst/api/exam.create",
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        ExamTable,
        MCQuestionTable,
        QuizfolderTable,
      ],
    });

    api.route("POST /api/exam/remove", {
      handler: "sst/api/exam.remove",
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        ExamTable,
        MCQuestionTable,
        QuizfolderTable,
      ],
    });
    api.route("POST /api/exam/list", {
      handler: "sst/api/exam.list",
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        ExamTable,
        MCQuestionTable,
        QuizfolderTable,
      ],
    });
    api.route("POST /api/exam/get", {
      handler: "sst/api/exam.get",
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        ExamTable,
        MCQuestionTable,
        QuizfolderTable,
      ],
    });
    api.route("POST /api/exam/update", {
      handler: "sst/api/exam.update",
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        ExamTable,
        MCQuestionTable,
        QuizfolderTable,
      ],
    });

    api.route("POST /api/exam/publicList", {
      handler: "sst/api/exam.publicList",
      link: [
        myUGCBucket,
        myCDN,
        api,
        UsersTable,
        ExamTable,
        MCQuestionTable,
        QuizfolderTable,
      ],
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
    // Folder
    //////////////////

    api.route("POST /api/folder/create", {
      handler: "sst/api/folder.create",
      link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    });

    api.route("POST /api/folder/remove", {
      handler: "sst/api/folder.remove",
      link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    });
    api.route("POST /api/folder/list", {
      handler: "sst/api/folder.list",
      link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    });
    api.route("POST /api/folder/get", {
      handler: "sst/api/folder.get",
      link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    });
    api.route("POST /api/folder/update", {
      handler: "sst/api/folder.update",
      link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    });

    api.route("POST /api/folder/publicList", {
      handler: "sst/api/folder.publicList",
      link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    });

    //////////////////
    //////////////////
    //////////////////
    //////////////////

    // const AZURE_CHAT_URL = new sst.Secret("AZURE_CHAT_URL");
    // const AZURE_CHAT_KEY = new sst.Secret("AZURE_CHAT_KEY");

    // let getCommon = () => [
    //   myUGCBucket,
    //   myCDN,
    //   api,
    //   UsersTable,
    //   AZURE_CHAT_URL,
    //   AZURE_CHAT_KEY,
    //   PresentationOutlineTable,
    //   QuestionAnswerTable,
    // ];
    // // //////////////////
    // // //////////////////
    // // api.route("POST /api/presentation/create", {
    // //   handler: "sst/api/presentation.create",
    // //   link: [
    // //     //
    // //     ...getCommon(),
    // //   ],
    // // });

    // // api.route("POST /api/presentation/remove", {
    // //   handler: "sst/api/presentation.remove",
    // //   link: [
    // //     //
    // //     ...getCommon(),
    // //   ],
    // // });
    // // api.route("POST /api/presentation/list", {
    // //   handler: "sst/api/presentation.list",
    // //   link: [
    // //     //
    // //     ...getCommon(),
    // //   ],
    // // });
    // // api.route("POST /api/presentation/get", {
    // //   handler: "sst/api/presentation.get",
    // //   link: [
    // //     //
    // //     ...getCommon(),
    // //   ],
    // // });
    // // api.route("POST /api/presentation/update", {
    // //   handler: "sst/api/presentation.update",
    // //   link: [
    // //     //
    // //     ...getCommon(),
    // //   ],
    // // });

    // // api.route("POST /api/presentation/publicList", {
    // //   handler: "sst/api/presentation.publicList",
    // //   link: [
    // //     //
    // //     ...getCommon(),
    // //   ],
    // // });

    // const GenerateOutline = new sst.aws.Function("GenerateOutline", {
    //   url: {
    //     cors: true,
    //   },
    //   streaming: true,
    //   handler: "sst/api/presentation.generateOutline",
    //   link: [
    //     //
    //     ...getCommon(),
    //   ],
    //   timeout: "900 seconds",
    // });

    // const GenerateAnswerFnc = new sst.aws.Function("GenerateAnswer", {
    //   url: {
    //     cors: true,
    //   },
    //   streaming: true,
    //   handler: "sst/api/presentation.generateAnswer",
    //   link: [
    //     //
    //     ...getCommon(),
    //   ],
    //   timeout: "900 seconds",
    // });

    // api.route("POST /api/presentation/rest", {
    //   handler: "sst/api/presentation.rest",
    //   link: [
    //     //
    //     ...getCommon(),
    //     //
    //     GenerateOutline,
    //     GenerateAnswerFnc,
    //   ],
    // });

    //
    //

    //////////////////
    //////////////////
    // Video
    //////////////////

    api.route("POST /api/video/createVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.createVideo",
    });
    api.route("POST /api/video/removeVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.removeVideo",
    });
    api.route("POST /api/video/listVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.listVideo",
    });
    api.route("POST /api/video/listVideoSlug", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.listVideoSlug",
    });

    //////////////////
    //////////////////
    //////////////////

    //////////////////
    //////////////////
    //////////////////

    api.route("POST /api/video/countVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.countVideo",
    });
    api.route("POST /api/video/getVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.getVideo",
    });
    api.route("POST /api/video/updateVideo", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.updateVideo",
    });

    api.route("POST /api/video/publicListVideos", {
      link: [myUGCBucket, myCDN, api, UsersTable, VideoTable, PlayListTable],
      handler: "sst/api/video.publicListVideos",
    });

    //////////////////
    //////////////////
    //////////////////
    //////////////////
    //////////////////
    //////////////////

    //////////////////

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
