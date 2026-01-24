export default {
  async fetch(request) {
    return new Response("Hello from CFspider test!", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
