declare module 'react-native-ntp-client' {
  interface NTPClient {
    getNetworkTime(server: string, port?: number, timeout?: number): Promise<Date>;
  }
  const client: NTPClient;
  export default client;
}
