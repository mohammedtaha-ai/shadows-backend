// Generated NON-PRODUCT DTO from artifacts/openapi.json.
import 'dart:convert';
import 'dart:io';
class ProbeReply {
  final String id;
  final int revision;
  ProbeReply(this.id, this.revision);
  factory ProbeReply.fromJson(Map<String,dynamic> j) {
    if (j['id'] is! String || j['revision'] is! int || (j['revision'] as int) < 0 || j.keys.any((k) => !["id","revision"].contains(k))) throw FormatException('Invalid probe reply');
    return ProbeReply(j['id'] as String, j['revision'] as int);
  }
}
Future<void> main() async {
  final client = HttpClient();
  try {
    final req = await client.postUrl(Uri.parse('http://127.0.0.1:45871/probe'));
    req.headers.contentType = ContentType.json; req.write(jsonEncode({'id':'fixture','revision':1}));
    final res = await req.close(); if(res.statusCode != 200) throw StateError('HTTP failure');
    final value = ProbeReply.fromJson(jsonDecode(await res.transform(utf8.decoder).join()));
    if(value.id != 'fixture' || value.revision != 1) throw StateError('Compatibility failure');
    for (final j in [{'id':'fixture','revision':'1'}, {'id':'fixture','revision':-1}, {'revision':1}]) {
      var refused = false; try { ProbeReply.fromJson(j); } on FormatException { refused=true; }
      if(!refused) throw StateError('Invalid reply accepted');
    }
    print('PASS compiled Dart HTTP consumer and 3 invalid reply fixtures');
  } finally { client.close(force:true); }
}
