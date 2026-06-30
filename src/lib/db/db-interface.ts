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

export interface IDatabase {
  // Users
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'createdAt'>): Promise<User>;
  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>;
  listUsers(): Promise<User[]>;

  // Projects
  getProject(id: string): Promise<Project | null>;
  createProject(project: Omit<Project, 'createdAt'>): Promise<Project>;
  listProjects(userId: string): Promise<Project[]>;

  // Characters
  getCharacter(id: string): Promise<Character | null>;
  listCharacters(userId: string): Promise<Character[]>;
  createCharacter(character: Omit<Character, 'createdAt' | 'updatedAt'>): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Character>;
  deleteCharacter(id: string): Promise<boolean>;

  // Character Assets
  getAsset(id: string): Promise<CharacterAsset | null>;
  listAssets(characterId: string): Promise<CharacterAsset[]>;
  createAsset(asset: Omit<CharacterAsset, 'createdAt'>): Promise<CharacterAsset>;

  // Generations
  getGeneration(id: string): Promise<Generation | null>;
  listGenerations(userId: string): Promise<Generation[]>;
  createGeneration(generation: Omit<Generation, 'createdAt'>): Promise<Generation>;
  updateGeneration(id: string, updates: Partial<Omit<Generation, 'id' | 'createdAt'>>): Promise<Generation>;

  // Videos
  getVideo(id: string): Promise<Video | null>;
  listVideos(userId: string): Promise<Video[]>;
  createVideo(video: Omit<Video, 'createdAt'>): Promise<Video>;
  updateVideo(id: string, updates: Partial<Omit<Video, 'id' | 'createdAt'>>): Promise<Video>;

  // Credit Ledger
  createLedgerEntry(entry: Omit<CreditLedger, 'id' | 'createdAt'>): Promise<CreditLedger>;
  listLedgerEntries(userId: string): Promise<CreditLedger[]>;

  // Provider Configurations
  getProviderConfigs(): Promise<ProviderConfig[]>;
  updateProviderConfig(id: string, updates: Partial<Omit<ProviderConfig, 'id' | 'createdAt'>>): Promise<ProviderConfig>;
}
