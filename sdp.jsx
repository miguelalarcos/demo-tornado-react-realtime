import React from 'react';
import ReactDOM from 'react-dom';
import { observable } from 'mobx';
import Observer from 'mobx-react';
import _ from 'underscore';

let id = 0;

const ws = new WebSocket('ws://localhost:8888/ws');

const callbacks = {};

ws.onmessage = function incoming(data) {
    console.log('->', data.data);
    data = JSON.parse(data.data);
    const callback = callbacks[data.id];
    if(callback) {
        if(data.msg === 'method'){
            callback(data.result);
        }else {
            callback(data);
        }
    }
};

export class SubsComponent extends React.Component{

    constructor() {
        super();
        this.store = observable([]);
        this.handle = this.handle.bind(this);
        this.sub_id = null;
    }

    handle(msg){
        if(msg.msg === 'added'){
            let index = this.sort_index(msg.doc);
            this.store.splice(index, 0, msg.doc);
        }else if(msg.msg === 'changed'){
            let tmp = this.store.slice();
            let index = _.findIndex(tmp, (x, i)=>x.id === msg.doc.id);
            this.store.splice(index, 1);
            index = this.sort_index(msg.doc);
            this.store.splice(index, 0, msg.doc);
        }else{
            let tmp = this.store.slice();
            let index = _.findIndex(tmp, (x, i)=>x.id === msg.doc_id);
            this.store.splice(index, 1)
        }
    }

    sort_index(new_val){
        let values = this.store.slice();
        let index = 0;
        for(let x of values){
            let v = this.sort_cmp(x, new_val);
            if(v < 0){
                return index;
            }
            index += 1;
        }
        return index;
    }

    sort_cmp(x, new_val){
        let sort_keys = this.sort_keys.slice();
        let ret = 0;
        let t = 'asc';
        let k = null;
        while(sort_keys.length !== 0){
            let [k, t] = sort_keys.shift();
            if(x[k] >= new_val[k]){
                return t === 'asc' ? -1: 1;
            }else if(x[k] <= new_val[k]){
                return t === 'asc' ? 1: -1;
            }
        }
        return ret;
    }

    sub(sub, params){
        if(this.sub_id !== null){
            this.clear();
        }
        id += 1;
        let data = {msg: 'sub', name: sub, id: id, params: params};
        data = JSON.stringify(data);
        ws.send(data);
        callbacks[id] = this.handle;
        this.sub_id = id;
    }

    clear(){
        this.store.splice(0, this.store.length);
        let data = {msg: 'unsub', id: this.sub_id};
        data = JSON.stringify(data);
        ws.send(data);
        delete callbacks[this.sub_id];
    }

    componentWillUnmount(){
        if(this.sub_id !== null){
            this.clear();
        }
    }
}

export const start = (App) => {
    ws.onopen = function open() {
        ReactDOM.render(
            <App />,
            document.getElementById('container')
        );
    };
}

class ClassRPC{
    call(sub, params, callback){
        id += 1;
        let data = {msg: 'method', method: sub, id: id, params: params};
        data = JSON.stringify(data);
        ws.send(data);
        if(callback) {
            callbacks[id] = callback;
        }
    }
}

export const RPC = new ClassRPC();