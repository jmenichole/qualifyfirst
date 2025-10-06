// CPX Research Wall Integration
// Generates secure URLs for CPX Research wall integration

import crypto from 'crypto';

export interface CPXWallConfig {
  appId: string;
  userId: string;
  username?: string;
  email?: string;
  subid1?: string;
  subid2?: string;
  messageId?: string;
}

export class CPXWallIntegration {
  private securityHash: string;

  constructor() {
    this.securityHash = process.env.CPX_SECURITY_HASH_KEY || 'VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL';
  }

  // Generate secure hash for wall URL
  generateSecureHash(userId: string): string {
    // CPX wall secure hash format: MD5(user_id + '-' + security_hash)
    const hashString = userId + '-' + this.securityHash;
    return crypto.createHash('md5').update(hashString).digest('hex');
  }

  // Generate complete CPX wall URL
  generateWallURL(config: CPXWallConfig): string {
    const secureHash = this.generateSecureHash(config.userId);
    
    const params = new URLSearchParams({
      app_id: config.appId,
      ext_user_id: config.userId,
      secure_hash: secureHash,
      username: config.username || '',
      email: config.email || '',
      subid_1: config.subid1 || '',
      subid_2: config.subid2 || '',
    });

    // Add message_id if provided
    if (config.messageId) {
      params.append('message_id', config.messageId);
    }

    return `https://wall.cpx-research.com/index.php?${params.toString()}`;
  }

  // Generate redirect URL for CPX dashboard configuration
  generateRedirectURL(baseUrl: string): string {
    return `${baseUrl}/cpx-research?message_id={message_id}`;
  }
}

// Singleton instance
export const cpxWallIntegration = new CPXWallIntegration();