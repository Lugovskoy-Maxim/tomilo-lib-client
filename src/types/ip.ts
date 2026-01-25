export interface IpStats {
  totalRequests: number;
  uniqueIps: number;
  topIps: Array<{
    ip: string;
    requestCount: number;
    lastAccess: string;
  }>;
  requestsByHour: Array<{
    hour: number;
    count: number;
  }>;
  blockedCount: number;
}

export interface BlockedIp {
  _id: string;
  ip: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
  expiresAt?: string;
}

export interface BlockIpDto {
  ip: string;
  reason: string;
  expiresAt?: string;
}

export interface UnblockIpDto {
  ip: string;
}

export interface IpStatsResponse {
  success: boolean;
  data: IpStats;
}

export interface BlockedIpsResponse {
  success: boolean;
  data: {
    ips: BlockedIp[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface BlockIpResponse {
  success: boolean;
  data: BlockedIp;
  message: string;
}

export interface UnblockIpResponse {
  success: boolean;
  message: string;
}
