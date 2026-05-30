"use node";

import { google } from "googleapis";
import { randomUUID } from "crypto";

type CreateMeetParams = {
  title: string;
  date: string;
  time: string;
  durationMinutes?: number;
  attendeeEmails?: string[];
  agenda?: string;
};

export async function createGoogleMeetEvent(
  params: CreateMeetParams,
): Promise<{ meetLink: string; calendarEventId: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Calendar API is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to your Convex environment variables.",
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || "Asia/Kolkata";
  const durationMinutes = params.durationMinutes ?? 60;

  const [hours, minutes] = params.time.split(":").map(Number);
  const endTotalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(endTotalMinutes / 60) % 24;
  const endMinutes = endTotalMinutes % 60;
  const endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;

  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: "none",
    requestBody: {
      summary: params.title,
      description: params.agenda,
      start: { dateTime: `${params.date}T${params.time}:00`, timeZone },
      end: { dateTime: `${params.date}T${endTime}:00`, timeZone },
      attendees: params.attendeeEmails?.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const meetLink =
    event.data.hangoutLink ||
    event.data.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === "video",
    )?.uri;

  if (!meetLink || !event.data.id) {
    throw new Error("Google Meet link was not returned from the Calendar API.");
  }

  return { meetLink, calendarEventId: event.data.id };
}
