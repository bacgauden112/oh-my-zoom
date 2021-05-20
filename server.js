const express = require("express");
require("dotenv").config();
const path = require("path");
const AWS = require("aws-sdk");
const chime = new AWS.Chime({ region: process.env.AWS_CHIME_DEFAULT_REGION });
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = process.env.PORT;
chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
//setup public folder
app.use(express.static("./public"));

AWS.config.update({
  region: "ap-southeast-1",
});

const join = async (req, res) => {
  const query = req.query;
  let meetingId = null;
  let meeting = null;
  if (!query.meetingId) {
    meetingId = uuidv4();
    // console.log("meetingId start", meetingId);
    meeting = await chime
      .createMeeting({
        ClientRequestToken: meetingId,
        MediaRegion: process.env.AWS_CHIME_MEDIA_REGION,
        ExternalMeetingId: meetingId,
      })
      .promise();
  } else {
    meetingId = query.meetingId;
    meeting = await chime
      .getMeeting({
        MeetingId: meetingId,
      })
      .promise();
  }

  const attendee = await chime
    .createAttendee({
      MeetingId: meeting.Meeting.MeetingId,
      ExternalUserId: `${uuidv4().substring(0, 8)}#${query.clientId}`,
    })
    .promise();
  // console.log("=====attendee=====", attendee);
  // console.log("=====meeting=====", meeting);

  return res.json({
    Info: {
      Meeting: meeting,
      Attendee: attendee,
    },
  });
};
app.get("/", (req, res) => res.render("index"));
app.post("/join", join);
app.get("/ok", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
