/**
 * MCP Server Module Tests - TaskFlow AI v4.0
 */

describe('MCPServer', () => {
  it('should export MCPServer class', async () => {
    const mod = await import('../index');
    expect(mod.MCPServer).toBeDefined();
    expect(typeof mod.MCPServer).toBe('function');
  });

  it('should create instance with settings and config', async () => {
    const { MCPServer } = await import('../index');
    const server = new MCPServer(
      { serverName: 'test', version: '1.0' },
      {}
    );
    expect(server).toBeDefined();
  });
});

describe('MCPRequestHandlers', () => {
  it('should export MCPRequestHandlers', async () => {
    const mod = await import('../handlers');
    expect(mod.MCPRequestHandlers).toBeDefined();
  });
});

describe('MCPToolExecutor', () => {
  it('should export MCPToolExecutor', async () => {
    const mod = await import('../executor');
    expect(mod.MCPToolExecutor).toBeDefined();
  });
});
