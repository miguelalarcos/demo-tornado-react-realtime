# Vue.js --- SDP --- Tornado --- Rethinkdb
# SDP: Subscription Data Protocol
import tornado
import tornado.ioloop
import tornado.websocket
from tornado.queues import Queue
import time
import ejson
import rethinkdb as r
from tornado import gen


r.set_loop_type("tornado")
#https://www.rethinkdb.com/docs/async-connections/
sessions = {}

class SDP(tornado.websocket.WebSocketHandler):

    def __init__(self, application, request):
        super().__init__(application, request)
        self.conn = r.connect(host='localhost', port=28015, db='test')
        self.session = time.time()
        sessions[self.session] = self
        self.registered_feeds = {}
        self.pending_unsubs = []
        self.queue = Queue()
        tornado.ioloop.IOLoop.current().spawn_callback(self.consumer)

    @gen.coroutine
    def feed(self, sub_id, query):
        conn = yield self.conn
        feed = yield query.changes().run(conn) # send initials
        self.registered_feeds[sub_id] = feed
        while (yield feed.fetch_next()):
            item = yield feed.next()
            if item['old_val'] is None:
                self.send_added(sub_id, item['new_val'])
            elif item['new_val'] is None:
                self.send_removed(sub_id, item['old_val']['id'])
            else:
                self.send_changed(sub_id, item['new_val'])

    def send(self, data):
        self.write_message(ejson.dumps(data))

    def send_result(self, id, result):
        self.write_message({'msg': 'result', 'id': id, 'result': result})

    def send_error(self, id, error):
        self.write_message({'msg': 'error', 'id': id, 'error': error})

    def send_added(self, sub_id, doc):
        self.write_message({'msg': 'added', 'id': sub_id, 'doc': doc})

    def send_changed(self, sub_id, doc):
        self.write_message({'msg': 'changed', 'id': sub_id, 'doc': doc})

    def send_removed(self, sub_id, doc_id):
        self.write_message({'msg': 'removed', 'id': sub_id, 'doc_id': doc_id})

    def send_ready(self, sub_id):
        self.write_message({'msg': 'ready', 'id': sub_id})

    def send_nosub(self, sub_id, error):
        self.write_message({'msg': 'nosub', 'id': sub_id, 'error': error})

    def send_nomethod(self, method_id, error):
        self.write_message({'msg': 'nomethod', 'id': method_id, 'error': error})

    def send_event(self, msg, data):
        data.msg = msg
        self.write_message(data)

    def on_open(self):
        pass

    def on_message(self, msg):
        @gen.coroutine
        def helper(msg):
            self.queue.put(msg)
        tornado.ioloop.IOLoop.current().spawn_callback(helper, msg)

    # consumer can be recoded as:
    # http: // www.tornadoweb.org / en / stable / queues.html?highlight = queue
    @gen.coroutine
    def consumer(self):
        while True:
            msg = yield self.queue.get()
            if msg == 'stop':
                return
            data = ejson.loads(msg)
            message = data['msg']

            if message == 'method':
                prefixed = 'method_' + data['method']
                try:
                    method = getattr(self, prefixed)
                except AttributeError:
                    self.send_nomethod(data['id'], 'method does not exist')
                    return

                result = yield method(**data['params'])
                self.send_result(data['id'], result)
            elif message == 'sub':
                prefixed = 'sub_' + data['name']
                try:
                    query = getattr(self, prefixed)(**data['params'])
                    yield self.feed(data['id'], query)
                except AttributeError:
                    self.send_nosub(data['id'], 'sub does not exist')
            elif message == 'unsub':
                id = data['id']
                feed = self.registered_feeds[id]
                feed.close()
                del self.registered_feeds[id]
            self.queue.task_done()


    def on_close(self):
        for feed in self.registered_feeds:
            feed.close()
        del sessions[self.session]

        @gen.coroutine
        def helper():
            self.queue.put('stop')
        tornado.ioloop.IOLoop.current().spawn_callback(helper)

    @gen.coroutine
    def method_insert(self, id, collection, doc):
        self.before_insert(collection, doc)
        conn = yield self.conn
        result = yield r.table(collection).insert(doc).run(conn)
        self.after_insert()

    def before_insert(self, collection, doc):
        pass

    def after_insert(self):
        pass