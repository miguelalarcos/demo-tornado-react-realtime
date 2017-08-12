import React from 'react';
import ReactDOM from 'react-dom';
import { observable } from 'mobx';
import Observer from 'mobx-react';
import _ from 'underscore';

let id = 0;

const ws = new WebSocket('ws://localhost:8888/ws');

const callbacks = {};

class ObservableMsgStore {
	@observable msgs = [];
}

ws.onopen = function open() {
    ReactDOM.render(
        <App />,
        document.getElementById('container')
    );
};

ws.onmessage = function incoming(data) {
  console.log('->', data.data);
  data = JSON.parse(data.data);
  const callback = callbacks[data.id];
  if(callback) {
      callback(data);
  }
};


@Observer.observer
class Item extends React.Component{
    constructor(){
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        const to_color = this.props.color === 'red'? 'blue': 'red';
        id += 1;
        let data = {msg: 'method', method: 'change_color', id: id,
            params: {id: this.props.msg.id, color: to_color}};
        data = JSON.stringify(data);
        ws.send(data);
    }

    render() {
        return <div>{this.props.msg.matricula}<a href="#" onClick={this.handleClick}>change color</a></div>;
    }
}


class List extends React.Component{
    constructor() {
        super();
        this.store = new ObservableMsgStore();
        this.handle = this.handle.bind(this);
    }

    handle(msg){
        console.log('handle', msg);
        if(msg.msg === 'added'){
            console.log(this.store.msgs.slice());
            this.store.msgs.push(msg.doc);
            console.log(this.store.msgs.slice());
        }else if(msg.msg === 'changed'){
            let tmp = this.store.msgs.slice();
            let index = _.findIndex(tmp, (x, i)=>x.id === msg.doc.id);
            this.store.msgs.splice(index, 1)
            this.store.msgs.push(msg.doc)
        }else{
            let tmp = this.store.msgs.slice();
            let index = _.findIndex(tmp, (x, i)=>x.id === msg.doc_id);
            console.log('index:', index);
            this.store.msgs.splice(index, 1)
        }
    }

    sub(){
        id += 1;
        let data = {msg: 'sub', name: 'cars_of_color', id: id, params: {color: this.color}};
        data = JSON.stringify(data);
        ws.send(data);
        callbacks[id] = this.handle;
    }

    render(){
        const msgs = this.store.msgs.map((msg)=><span><Item msg={msg} color={this.color} /></span>);
        return <div>{msgs}</div>;
    }
}

@Observer.observer
class RedList extends List{
    constructor(){
        super();
        this.color = 'red';
        this.sub();
    }
}

@Observer.observer
class BlueList extends List{
    constructor(){
        super();
        this.color = 'blue';
        this.sub();
    }
}

class App extends React.Component{
    render(){
        return (
            <div>
                <RedList/>
                <hr />
                <BlueList/>
            </div>
        );
    }
}

/*
ReactDOM.render(
    <App />,
    document.getElementById('container')
);
*/
