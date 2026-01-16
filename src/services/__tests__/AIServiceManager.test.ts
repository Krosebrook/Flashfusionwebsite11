import { afterEach, beforeEach, describe, expect, it, vi, type SpyInstance } from 'vitest';
import { AIServiceManager, type AIProvider } from '../AIServiceManager';

describe('AIServiceManager helper methods', () => {
  let manager: AIServiceManager;
  let callProviderSpy: SpyInstance;

  const mockProvider: AIProvider = {
    name: 'MockProvider',
    apiKey: 'test-key',
    baseUrl: 'https://mock',
    models: ['mock-model'],
    capabilities: ['text-generation'],
    rateLimits: {
      requestsPerMinute: 100,
      tokensPerMinute: 1000
    }
  };

  beforeEach(() => {
    manager = new AIServiceManager();
    vi.spyOn(manager as any, 'selectOptimalProvider').mockResolvedValue(mockProvider);
    vi.spyOn(manager as any, 'checkRateLimit').mockReturnValue(true);
    callProviderSpy = vi.spyOn(manager as any, 'callProvider').mockResolvedValue({
      content: 'result',
      model: 'mock-model',
      usage: {
        promptTokens: 1,
        completionTokens: 1,
        totalTokens: 2
      }
    });
    vi.spyOn(manager as any, 'logUsage').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generateCode delegates to generateContent and returns provider data', async () => {
    const generateContentSpy = vi.spyOn(manager, 'generateContent');

    const response = await manager.generateCode('Create a function', 'typescript');

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(callProviderSpy).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      content: 'result',
      model: 'mock-model',
      provider: mockProvider.name
    });
  });

  it('generateContentForType builds an AIRequest and resolves via generateContent', async () => {
    const generateContentSpy = vi.spyOn(manager, 'generateContent');

    const response = await manager.generateContentForType('Write a blog post', 'blog');

    expect(generateContentSpy).toHaveBeenCalledWith({
      prompt: 'Write a blog post',
      systemPrompt: expect.stringContaining('content creator specializing in blog'),
      temperature: 0.8,
      maxTokens: 4000
    });
    expect(callProviderSpy).toHaveBeenCalledTimes(1);
    expect(response.content).toBe('result');
  });

  it('generateContent rejects when no provider is available', async () => {
    (manager as any).selectOptimalProvider.mockResolvedValueOnce(null);

    await expect(manager.generateCode('code please')).rejects.toThrow('No available AI providers configured');
    expect(callProviderSpy).not.toHaveBeenCalled();
  });
});
