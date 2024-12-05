import Replicate from "replicate";
const replicate = new Replicate({
  auth: Resource.REPLICATE_API_TOKEN.value,
});

import { LambdaFunctionURLEvent } from "aws-lambda";
import { Resource } from "sst";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const s3 = new S3Client({});
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
// import { dynaClient } from "./client";
// import {
//   GetItemCommand,
//   PutItemCommand,
//   UpdateItemCommand,
// } from "@aws-sdk/client-dynamodb";
// import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export const speechAssessmentCheck = async (event: LambdaFunctionURLEvent) => {
  // // console.log(event.headers);
  // let assessmentkey = event.headers.assessmentkey;
  // console.log("assessmentkey", `${assessmentkey}`);
  // const data = await dynaClient.send(
  //   new GetItemCommand({
  //     TableName: Resource.SpeechAssessmentTable.name,
  //     Key: {
  //       itemID: {
  //         S: `${assessmentkey}`,
  //       },
  //     },
  //   })
  // );
  // console.log(data);
  // let Item = data.Item;
  // if (Item) {
  //   return unmarshall(Item);
  // } else {
  //   throw new Error("Assessment not found:  " + assessmentkey);
  // }

  return {
    //
  };
};

export const speechAssessment = async (event: LambdaFunctionURLEvent) => {
  // console.log(event.headers);

  let assessmentkey = event.headers.assessmentkey;
  let topic = event.headers.topic || "Talk about your day today";

  return await new Promise((resolve) => {
    // please refer to Reading sample to get pronunciation/accuracy/fluency/prosody score.

    console.log("Topic: ", topic);
    let buffer = Buffer.from(event.body, "base64");
    var audioConfig = sdk.AudioConfig.fromWavFileInput(
      // fs.readFileSync("Sample_1.wav")
      buffer,
      "AudioInput.wav"
    );
    var speechConfig = sdk.SpeechConfig.fromSubscription(
      Resource.AZURE_SPEECH_KEY_1.value,
      Resource.AZURE_SPEECH_REGION.value
    );

    // setting the recognition language to English.
    speechConfig.speechRecognitionLanguage = "en-US";

    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
      "",
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      false
    );
    pronunciationAssessmentConfig.enableProsodyAssessment = true;
    pronunciationAssessmentConfig.enableContentAssessmentWithTopic(topic);

    // create the speech recognizer.
    var reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(reco);

    var results = [];
    var recognizedText = "";

    reco.recognized = function (s, e) {
      var jo = JSON.parse(
        e.result.properties.getProperty(
          sdk.PropertyId.SpeechServiceResponse_JsonResult
        )
      );

      if (jo.DisplayText != ".") {
        console.log(`Recognizing: ${jo.DisplayText}`);
        recognizedText += jo.DisplayText + " ";
      }
      results.push(jo);

      // if (results.length === 1) {
      //   let data = {
      //     itemID: assessmentkey,
      //     state: "loading",
      //     results: results,
      //     topic,
      //     recognizedText,
      //   };

      //   console.log("write", data);
      //   dynaClient.send(
      //     new UpdateItemCommand({
      //       TableName: Resource.SpeechAssessmentTable.name,
      //       Key: {
      //         itemID: {
      //           S: `${assessmentkey}`,
      //         },
      //       },
      //       AttributeUpdates: {
      //         state: {
      //           Value: {
      //             S: data.state,
      //           },
      //           Action: "PUT",
      //         },
      //         results: {
      //           Value: {
      //             S: JSON.stringify(results),
      //             // S: JSON.stringify(),
      //           },
      //           Action: "PUT",
      //         },
      //         topic: {
      //           Value: {
      //             S: topic,
      //           },
      //           Action: "PUT",
      //         },
      //         recognizedText: {
      //           Value: {
      //             S: recognizedText,
      //           },
      //           Action: "PUT",
      //         },
      //       },
      //     })
      //   );
      // } else if (results.length > 1) {
      //   dynaClient.send(
      //     new PutItemCommand({
      //       TableName: Resource.SpeechAssessmentTable.name,
      //       Item: marshall({
      //         itemID: `${assessmentkey}`,
      //         state: "loading",
      //         results: JSON.stringify(results),
      //         topic,
      //         recognizedText,
      //       }),
      //     })
      //   );
      // }
    };

    function onRecognizedResult() {
      console.log(`Recognized text: ${recognizedText}`);

      resolve({
        itemID: `${assessmentkey}`,
        state: "complete",
        results,
        topic,
        recognizedText,
      });

      // let data = {
      //   itemID: assessmentkey,
      //   state: "complete",
      // };

      // console.log("write", data);
      // dynaClient.send(
      //   new UpdateItemCommand({
      //     TableName: Resource.SpeechAssessmentTable.name,
      //     Key: {
      //       itemID: {
      //         S: `${assessmentkey}`,
      //       },
      //     },
      //     AttributeUpdates: {
      //       state: {
      //         Value: {
      //           S: data.state,
      //         },
      //         Action: "PUT",
      //       },
      //     },
      //   })
      // );

      // console.log(
      //   "Content assessment result: \n",
      //   "\tvocabulary score: ",
      //   Number(contentResult.VocabularyScore.toFixed(1)),
      //   "\n",
      //   "\tgrammar score: ",
      //   Number(contentResult.GrammarScore.toFixed(1)),
      //   "\n",
      //   "\ttopic score: ",
      //   Number(contentResult.TopicScore.toFixed(1))
      // );
    }

    reco.canceled = function (s, e) {
      if (e.reason === sdk.CancellationReason.Error) {
        var str =
          "(cancel) Reason: " +
          sdk.CancellationReason[e.reason] +
          ": " +
          e.errorDetails;
        console.log(str);
      }
      reco.stopContinuousRecognitionAsync();
    };

    reco.sessionStopped = function (s, e) {
      reco.stopContinuousRecognitionAsync();
      reco.close();
      onRecognizedResult();
    };

    reco.startContinuousRecognitionAsync();

    //
  });
};

export const speechToText = async (event: LambdaFunctionURLEvent) => {
  //
  //
  let base64 = `data:application/octet-stream;base64,${event.body}`;

  const output = await replicate.run(
    "openai/whisper:cdd97b257f93cb89dede1c7584e3f3dfc969571b357dbcee08e793740bedd854",
    {
      input: {
        audio: base64,
        model: "large-v3",
        language: "auto",
        translate: false,
        temperature: 0,
        transcription: "plain text",
        suppress_tokens: "-1",
        logprob_threshold: -1,
        no_speech_threshold: 0.6,
        condition_on_previous_text: true,
        compression_ratio_threshold: 2.4,
        temperature_increment_on_fallback: 0.2,
      },
    }
  );

  // console.log(event.body);
  // let http = event.requestContext.http;

  return output;
};

const b64toBlob = (b64Data, contentType = "", sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export const speechAnalysis = async (event: LambdaFunctionURLEvent) => {
  //
  //
  // let base64 = `data:application/octet-stream;base64,${event.body}`;
  const Key = crypto.randomUUID();

  const blob = b64toBlob(event.body, "audio/wav");

  const newFile = new File([await blob.arrayBuffer()], "audio.wav", {
    type: "audio/wav",
  });

  const cmd = new PutObjectCommand({
    Key: Key,
    Bucket: Resource.MyUGCBucket.name,
  });

  const url = await getSignedUrl(s3, cmd);

  const image = await fetch(url, {
    body: newFile,
    method: "PUT",
    headers: {
      "Content-Type": newFile.type,
      "Content-Disposition": `attachment; filename="${newFile.name}"`,
    },
  });

  let imageurl = image.url.split("?")[0];

  // const cdnURL = Resource.MyCDN.url;

  // const file = `${cdnURL}/${Key}`;

  // console.log(file);

  const output = await replicate.predictions.create({
    model: "wonglok/fluency",
    version: "c67f3081927c5f7d87dd3eb430a914d881c6ea1473d519e7265cd6489bf2d3de",
    webhook: `${Resource.MyApi.url}/api/audio/hook`,
    input: {
      urlLink: imageurl,
    },
  });

  // s3.send(
  //   new DeleteObjectCommand({
  //     Key: Key,
  //     Bucket: Resource.MyUGCBucket.name,
  //   })
  // );

  console.log(output);
  // console.log(event.body);
  // let http = event.requestContext.http;

  return output;
};

export async function hook(event: LambdaFunctionURLEvent) {
  console.log(event.body, event.headers);

  return {};
}

// /** developer */
// let developer = {
//   MySocket: `wss://d31hd1uzyb.execute-api.ap-southeast-2.amazonaws.com/$default`,
//   MyCDN: `https://d26pekkungptu7.cloudfront.net`,
//   MyApi: `https://if1vf12xd4.execute-api.ap-southeast-2.amazonaws.com`,
// };
