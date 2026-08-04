import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';

// GET web preview / redirect page for /join/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const group = await Group.findById(id);
    const groupName = group ? group.name : 'Novix Group';
    const memberCount = group ? group.members.length : 0;
    const groupAvatar = group?.avatar || '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${groupName} on Novix Messenger</title>
  <meta property="og:title" content="Join ${groupName} on Novix">
  <meta property="og:description" content="${groupName} has ${memberCount} members on Novix Messenger. Click to join!">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 20px;
      object-fit: cover;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 8px;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      margin: 0 0 24px;
    }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 16px;
      width: 100%;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="card">
    ${groupAvatar ? `<img src="${groupAvatar}" class="avatar" />` : `<div class="avatar">👥</div>`}
    <h1>${groupName}</h1>
    <p>${memberCount} members on Novix Messenger</p>
    <a href="novix://join/${id}" class="btn" onclick="openApp()">Join Group</a>
  </div>
  <script>
    function openApp() {
      setTimeout(function() {
        window.location.href = "https://novix-messenger-next-js.onrender.com/app";
      }, 2000);
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Group link error' }, { status: 500 });
  }
}
