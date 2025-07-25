import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import StudentProfile from "@/model/StudentProfile";
import { NextResponse, NextRequest } from "next/server";
import { Types } from "mongoose";

export async function GET(req: Request) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!session || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Not authenticated" }),
        { status: 401 }
      );
    }

    const studentProfile = await StudentProfile.findOne({ userId: user._id });
    if (!studentProfile) {
      return Response.json(
        { success: false, message: "Student has not created a profile yet." },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Fetched student profile",
        student: studentProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting student profile", error);
    return Response.json(
      { success: false, message: "Error getting student profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!session || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Not authenticated" }),
        { status: 401 }
      );
    }

    const { email, enrollmentNo, branch, year, cgpa, resumeUrl, skills } =
      await req.json();
    const userId = new Types.ObjectId(user._id);

    console.log("email, enrollmentNo, branch, year, cgpa, resumeLink, skills", {
      email,
      enrollmentNo,
      branch,
      year,
      cgpa,
      resumeUrl,
      skills,
    });

    if (!enrollmentNo || !branch || !year || !cgpa || !resumeUrl || !skills) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const profile = await StudentProfile.create({
      userId,
      email,
      enrollmentNo,
      branch,
      year,
      cgpa,
      resumeUrl,
      skills,
      isPlaced: false,
    });

    return NextResponse.json({ success: true, profile }, { status: 200 });
  } catch (error) {
    console.error("Student profile creation error", error);
    return Response.json(
      { success: false, message: "Error creating student profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const existing = await StudentProfile.findOne({ userId: session.user._id });
  if (!existing) {
    return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  existing.enrollmentNo = body.enrollmentNo ?? existing.enrollmentNo;
  existing.branch       = body.branch       ?? existing.branch;
  existing.year         = body.year         ?? existing.year;
  existing.cgpa         = body.cgpa         ?? existing.cgpa;
  existing.resumeUrl    = body.resumeUrl    ?? existing.resumeUrl;
  existing.skills       = body.skills       ?? existing.skills;
  existing.isPlaced     = body.isPlaced     ?? existing.isPlaced;
  
  if (body.email !== undefined) {
    existing.email = body.email;
  }

  await existing.save();
  return NextResponse.json({ success: true, profile: existing });
}
