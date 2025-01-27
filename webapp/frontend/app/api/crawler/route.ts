import axios from "axios";
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const { data } = await req.json();

    const response = await axios.get(data.hyperLink, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const title = $("title").text();

    return NextResponse.json({
      titleUrl: title ? title : data.hyperLink,
    }, { status: 200 });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
