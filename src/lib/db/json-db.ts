import fs from 'fs';
import path from 'path';
import { IDatabase } from './db-interface';
import {
  User,
  Project,
  Character,
  CharacterAsset,
  Generation,
  Video,
  CreditLedger,
  ProviderConfig
} from '@/types';

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

interface Schema {
  users: User[];
  projects: Project[];
  characters: Character[];
  characterAssets: CharacterAsset[];
  generations: Generation[];
  videos: Video[];
  creditLedgers: CreditLedger[];
  providerConfigs: ProviderConfig[];
}

const DEFAULT_DB: Schema = {
  users: [
    {
      id: 'usr_default',
      email: 'user@example.com',
      name: 'Creative Marketer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      plan: 'pro',
      creditBalance: 250,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_admin',
      email: 'admin@ai-influencer.studio',
      name: 'System Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      plan: 'agency',
      creditBalance: 10000,
      createdAt: new Date().toISOString()
    }
  ],
  projects: [
    {
      id: 'proj_default',
      userId: 'usr_default',
      name: 'My Influencers',
      description: 'Default project for creative AI influencers',
      createdAt: new Date().toISOString()
    }
  ],
  characters: [],
  characterAssets: [],
  generations: [],
  videos: [],
  creditLedgers: [
    {
      id: 'cld_init',
      userId: 'usr_default',
      action: 'grant',
      amount: 250,
      generationId: null,
      description: 'Welcome credit grant',
      createdAt: new Date().toISOString()
    }
  ],
  providerConfigs: [
    {
      id: 'prov_openai',
      providerName: 'OpenAI',
      type: 'image',
      modelName: 'dall-e-3',
      isActive: false,
      configJson: { apiKey: '' },
      createdAt: new Date().toISOString()
    },
    {
      id: 'prov_veo',
      providerName: 'Google Veo',
      type: 'video',
      modelName: 'veo-2.0',
      isActive: false,
      configJson: { apiKey: '', project: '', location: '' },
      createdAt: new Date().toISOString()
    },
    {
      id: 'prov_mock_image',
      providerName: 'Mock Image Provider',
      type: 'image',
      modelName: 'mock-sdxl-consistent',
      isActive: true,
      configJson: {},
      createdAt: new Date().toISOString()
    },
    {
      id: 'prov_mock_video',
      providerName: 'Mock Video Provider',
      type: 'video',
      modelName: 'mock-veo',
      isActive: true,
      configJson: {},
      createdAt: new Date().toISOString()
    }
  ]
};

export class JSONDatabase implements IDatabase {
  private readDB(): Schema {
    try {
      if (!fs.existsSync(DB_FILE_PATH)) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
        return DEFAULT_DB;
      }
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(data) as Schema;
    } catch (error) {
      console.error('Error reading JSON database:', error);
      return DEFAULT_DB;
    }
  }

  private writeDB(schema: Schema): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(schema, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing JSON database:', error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | null> {
    const db = this.readDB();
    return db.users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = this.readDB();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    const db = this.readDB();
    const newUser: User = {
      ...user,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    this.writeDB(db);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const db = this.readDB();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error(`User with ID ${id} not found.`);
    
    db.users[index] = {
      ...db.users[index],
      ...updates
    };
    this.writeDB(db);
    return db.users[index];
  }

  async listUsers(): Promise<User[]> {
    const db = this.readDB();
    return db.users;
  }

  // Projects
  async getProject(id: string): Promise<Project | null> {
    const db = this.readDB();
    return db.projects.find(p => p.id === id) || null;
  }

  async createProject(project: Omit<Project, 'createdAt'>): Promise<Project> {
    const db = this.readDB();
    const newProject: Project = {
      ...project,
      createdAt: new Date().toISOString()
    };
    db.projects.push(newProject);
    this.writeDB(db);
    return newProject;
  }

  async listProjects(userId: string): Promise<Project[]> {
    const db = this.readDB();
    return db.projects.filter(p => p.userId === userId);
  }

  // Characters
  async getCharacter(id: string): Promise<Character | null> {
    const db = this.readDB();
    return db.characters.find(c => c.id === id) || null;
  }

  async listCharacters(userId: string): Promise<Character[]> {
    const db = this.readDB();
    return db.characters.filter(c => c.userId === userId);
  }

  async createCharacter(character: Omit<Character, 'createdAt' | 'updatedAt'>): Promise<Character> {
    const db = this.readDB();
    const newCharacter: Character = {
      ...character,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.characters.push(newCharacter);
    this.writeDB(db);
    return newCharacter;
  }

  async updateCharacter(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Character> {
    const db = this.readDB();
    const index = db.characters.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Character with ID ${id} not found.`);

    db.characters[index] = {
      ...db.characters[index],
      ...updates,
      updatedAt: new Date().toISOString()
    } as Character;
    this.writeDB(db);
    return db.characters[index];
  }

  async deleteCharacter(id: string): Promise<boolean> {
    const db = this.readDB();
    const index = db.characters.findIndex(c => c.id === id);
    if (index === -1) return false;
    db.characters.splice(index, 1);
    // Also remove assets
    db.characterAssets = db.characterAssets.filter(a => a.characterId !== id);
    this.writeDB(db);
    return true;
  }

  // Character Assets
  async getAsset(id: string): Promise<CharacterAsset | null> {
    const db = this.readDB();
    return db.characterAssets.find(a => a.id === id) || null;
  }

  async listAssets(characterId: string): Promise<CharacterAsset[]> {
    const db = this.readDB();
    return db.characterAssets.filter(a => a.characterId === characterId);
  }

  async createAsset(asset: Omit<CharacterAsset, 'createdAt'>): Promise<CharacterAsset> {
    const db = this.readDB();
    const newAsset: CharacterAsset = {
      ...asset,
      createdAt: new Date().toISOString()
    };
    db.characterAssets.push(newAsset);
    this.writeDB(db);
    return newAsset;
  }

  // Generations
  async getGeneration(id: string): Promise<Generation | null> {
    const db = this.readDB();
    return db.generations.find(g => g.id === id) || null;
  }

  async listGenerations(userId: string): Promise<Generation[]> {
    const db = this.readDB();
    return db.generations.filter(g => g.userId === userId);
  }

  async createGeneration(generation: Omit<Generation, 'createdAt'>): Promise<Generation> {
    const db = this.readDB();
    const newGeneration: Generation = {
      ...generation,
      createdAt: new Date().toISOString()
    };
    db.generations.push(newGeneration);
    this.writeDB(db);
    return newGeneration;
  }

  async updateGeneration(id: string, updates: Partial<Omit<Generation, 'id' | 'createdAt'>>): Promise<Generation> {
    const db = this.readDB();
    const index = db.generations.findIndex(g => g.id === id);
    if (index === -1) throw new Error(`Generation with ID ${id} not found.`);

    db.generations[index] = {
      ...db.generations[index],
      ...updates
    } as Generation;
    this.writeDB(db);
    return db.generations[index];
  }

  // Videos
  async getVideo(id: string): Promise<Video | null> {
    const db = this.readDB();
    return db.videos.find(v => v.id === id) || null;
  }

  async listVideos(userId: string): Promise<Video[]> {
    const db = this.readDB();
    return db.videos.filter(v => v.userId === userId);
  }

  async createVideo(video: Omit<Video, 'createdAt'>): Promise<Video> {
    const db = this.readDB();
    const newVideo: Video = {
      ...video,
      createdAt: new Date().toISOString()
    };
    db.videos.push(newVideo);
    this.writeDB(db);
    return newVideo;
  }

  async updateVideo(id: string, updates: Partial<Omit<Video, 'id' | 'createdAt'>>): Promise<Video> {
    const db = this.readDB();
    const index = db.videos.findIndex(v => v.id === id);
    if (index === -1) throw new Error(`Video with ID ${id} not found.`);

    db.videos[index] = {
      ...db.videos[index],
      ...updates
    } as Video;
    this.writeDB(db);
    return db.videos[index];
  }

  // Credit Ledger
  async createLedgerEntry(entry: Omit<CreditLedger, 'id' | 'createdAt'>): Promise<CreditLedger> {
    const db = this.readDB();
    
    // Deduct/grant user actual credit balance
    const userIndex = db.users.findIndex(u => u.id === entry.userId);
    if (userIndex !== -1) {
      const user = db.users[userIndex];
      if (entry.action === 'deduct') {
        user.creditBalance -= entry.amount;
      } else if (entry.action === 'grant' || entry.action === 'refund' || entry.action === 'purchase') {
        user.creditBalance += entry.amount;
      }
    }

    const newEntry: CreditLedger = {
      ...entry,
      id: `cld_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString()
    };
    db.creditLedgers.push(newEntry);
    this.writeDB(db);
    return newEntry;
  }

  async listLedgerEntries(userId: string): Promise<CreditLedger[]> {
    const db = this.readDB();
    return db.creditLedgers.filter(c => c.userId === userId);
  }

  // Provider Configurations
  async getProviderConfigs(): Promise<ProviderConfig[]> {
    const db = this.readDB();
    return db.providerConfigs;
  }

  async updateProviderConfig(id: string, updates: Partial<Omit<ProviderConfig, 'id' | 'createdAt'>>): Promise<ProviderConfig> {
    const db = this.readDB();
    const index = db.providerConfigs.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Provider config with ID ${id} not found.`);

    db.providerConfigs[index] = {
      ...db.providerConfigs[index],
      ...updates
    } as ProviderConfig;
    this.writeDB(db);
    return db.providerConfigs[index];
  }
}

// Single database instance
export const db = new JSONDatabase();
export default db;
