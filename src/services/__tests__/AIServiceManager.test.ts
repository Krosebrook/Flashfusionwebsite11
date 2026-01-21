import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIServiceManager, AIProvider } from '../AIServiceManager';

describe('AIServiceManager helpers', () => {
  let manager: AIServiceManager;
  let provider: AIProvider;

  beforeEach(() => {
    vi.restoreAllMocks();

    provider = {
      name: 'TestAI',
      apiKey: 'test-key',
      baseUrl: 'http://test',
      models: ['test-model'],
      capabilities: ['text-generation'],
      rateLimits: { requestsPerMinute: 100, tokensPerMinute: 1000 }
    };

    manager = new AIServiceManager();

    vi.spyOn(manager as any, 'selectOptimalProvider').mockResolvedValue(provider);
    vi.spyOn(manager as any, 'checkRateLimit').mockReturnValue(true);
    vi.spyOn(manager as any, 'logUsage').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generateCode delegates to the unified generateContent method', async () => {
    const providerResponse = {
      content: 'generated code',
      model: 'test-model',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    };

    const callProviderSpy = vi
      .spyOn(manager as any, 'callProvider')
      .mockResolvedValue(providerResponse);

    const result = await manager.generateCode('write a function');

    expect(callProviderSpy).toHaveBeenCalledTimes(1);
    const [providerArg, requestArg] = callProviderSpy.mock.calls[0];

    expect(providerArg).toEqual(provider);
    expect(requestArg.prompt).toContain('write a function');
    expect(requestArg.systemPrompt).toContain('expert software developer');
    expect(result).toMatchObject({
      content: 'generated code',
      provider: provider.name,
      model: 'test-model',
      usage: providerResponse.usage
    });
  });

  it('generateContentForType uses the unified generateContent without recursion', async () => {
    const providerResponse = {
      content: 'crafted content',
      model: 'test-model',
      usage: { promptTokens: 5, completionTokens: 15, totalTokens: 20 }
    };

    const callProviderSpy = vi
      .spyOn(manager as any, 'callProvider')
      .mockResolvedValue(providerResponse);

    const result = await manager.generateContentForType('write a blog', 'blog');

    expect(callProviderSpy).toHaveBeenCalledTimes(1);
    const [providerArg, requestArg] = callProviderSpy.mock.calls[0];

    expect(providerArg).toEqual(provider);
    expect(requestArg.systemPrompt).toContain('professional content creator');
    expect(requestArg.prompt).toBe('write a blog');
    expect(result).toMatchObject({
      content: 'crafted content',
      provider: provider.name,
      model: 'test-model',
      usage: providerResponse.usage
    });
  });
});
