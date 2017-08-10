import tornado.ioloop
from tornado import gen
import tornado.web
from sdp import SDP
import rethinkdb as r

class App(SDP):
    @gen.coroutine
    def method_add(self, a, b):
        return a + b

    def sub_cars_of_color(self, color):
        return r.table('cars').filter({'color': color})

def make_app():
    return tornado.web.Application([
        (r"/ws", App),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()