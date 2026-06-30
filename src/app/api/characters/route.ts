import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value || 'usr_default';
    const characters = await db.listCharacters(userId);
    return NextResponse.json({ characters });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value || 'usr_default';
    const { name, niche, profileJson, projectId, characterSheetUrl, status } = await req.json();

    if (!name || !niche || !profileJson) {
      return NextResponse.json({ error: 'Name, niche, and profile details are required' }, { status: 400 });
    }

    // Fallback project if none specified
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const projects = await db.listProjects(userId);
      if (projects.length > 0) {
        targetProjectId = projects[0].id;
      } else {
        // Create one
        const newProj = await db.createProject({
          id: `proj_${Math.random().toString(36).substring(2, 11)}`,
          userId,
          name: 'My Workspace',
          description: 'Default project'
        });
        targetProjectId = newProj.id;
      }
    }

    const characterId = `char_${Math.random().toString(36).substring(2, 11)}`;
    const newCharacter = await db.createCharacter({
      id: characterId,
      userId,
      projectId: targetProjectId,
      name,
      niche,
      profileJson,
      visualDna: characterSheetUrl ? 'Uploaded Character Sheet' : '',
      characterSheetUrl: characterSheetUrl || '',
      status: status || (characterSheetUrl ? 'completed' : 'draft')
    });

    return NextResponse.json({ character: newCharacter }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
