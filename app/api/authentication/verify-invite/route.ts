import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("1. verify-invite route hit");

    const body = await request.json();
    console.log("2. Request body:", body);

    console.log("3. API_URL:", process.env.API_URL);
    console.log("4. API_KEY exists:", !!process.env.API_KEY);

    const apiUrl = `${process.env.API_URL}/verify-invite`;
    console.log("5. Full URL:", apiUrl);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({ token: body.token }),
    });

    console.log("6. Response status:", res.status);
    console.log("7. Response ok:", res.ok);

    const raw = await res.text();
    console.log("8. Raw response:", raw);

    let data;

    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("9. JSON parse failed");
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON from backend",
          raw,
        },
        { status: 500 }
      );
    }

    console.log("10. Parsed response:", data);

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("CATCH ERROR:", error);
    console.error("STACK:", error?.stack);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}