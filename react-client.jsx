import React from 'react';
import Observer from 'mobx-react';
import {start, SubsComponent, RPC} from "./sdp.jsx";

@Observer.observer
class Item extends React.Component{
    constructor(){
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        const to_color = this.props.msg.color === 'red'? 'blue': 'red';
        RPC.call('change_color', {id: this.props.msg.id, color: to_color});
    }

    render() {
        return <div>{this.props.msg.matricula}<a href="#" onClick={this.handleClick}>change color</a></div>;
    }
}

@Observer.observer
class Cars extends SubsComponent{
    constructor(props){
        super();
        this.sub('cars_of_color', {color: props.color});
    }

    render(){
        const msgs = this.store.map((msg)=><span><Item msg={msg} color={this.color} /></span>);
        return <div>{msgs}</div>;
    }
}

class App extends React.Component{
    render(){
        return (
            <div>
                <div>Red cars</div>
                <Cars color={'red'} />
                <div>Blue cars</div>
                <Cars color={'blue'} />
            </div>
        );
    }
}

start(App);
