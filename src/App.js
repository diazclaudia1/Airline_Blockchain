import React, { Component } from "react";
import Panel from "./Panel";
import getWeb3 from "./getWeb3";
import AirlineContract from "./airline";
import {AirlineService} from "./airlineService";

const converter = (web3) => {
    return (value) => {
        return web3.utils.fromWei(value.toString(), 'ether');
    }
}


export class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            account: undefined,
            balance: 0,
            flights: [],
            customerFlights: [],
            refundableEther: 0
        }
    }

    async componentDidMount(){
        
        this.web3 = await getWeb3();
        console.log(this.web3.version);

        this.toEther= converter(this.web3);

        this.airline = await AirlineContract(this.web3.currentProvider);
        console.log(this.airline.buyFlight);

        this.airlineService = new AirlineService(this.airline);

        var account = (await this.web3.eth.getAccounts())[0];
        console.log(account);

        let flightPurchased = this.airline.FlightPurchased();
        flightPurchased.watch(function(err, result){
            const {customer, price, flight} = result.args;
            if(customer === this.state.account){
                console.log(`You purchased a flights to ${flight} with a cost of ${price}`);
            }
        }.bind(this));

             
        this.setState({
            account: account.toLowerCase()
        }, () => {
            this.load();
        });
    }

    async getBalance(){
        let weiBalance = await this.web3.eth.getBalance(this.state.account);
        this.setState({
            balance: this.toEther(weiBalance)
        });
    }

    async getFlights(){
        let flights = await this.airlineService.getFlights();
        this.setState({
            flights
        });
    }

    async getRefundableEther(){
        let refundableEther = this.toEther(await this.airlineService.getRefundableEther(this.state.account));
        this.setState({
            refundableEther
        });
    }

    async refundLoyaltyPoints(){
        await this.airlineService.redeemLoyaltyPoints(this.state.account);
    }

    async getCustomerFlights(){
        let customerFlights = await this.airlineService.getCustomerFlights(this.state.account);
        this.setState({
            customerFlights
        });
    }

    async buyFlight(flightIndex, flight){
        console.log(flightIndex);
        console.log(flight.name);
        await this.airlineService.buyFlight(
            flightIndex, 
            this.state.account, 
            flight.price
            );
    }

    async load(){
        this.getBalance();
        this.getFlights();
        this.getCustomerFlights();
        this.getRefundableEther();
    }

    render() {
        return <React.Fragment>
            <div className="jumbotron">
                <h4 className="display-4">Welcome to the Airline!</h4>
            </div>

            <div className="row">
                <div className="col-sm">
                    <Panel title="Balance">
                        <p><strong>{this.state.account}</strong></p>
                        <span><strong>Balance: </strong>{this.state.balance}</span>
                    </Panel>
                </div>
                <div className="col-sm">
                    <Panel title="Loyalty points - refundable ether">
                        <span>{this.state.refundableEther} eth</span>
                        <button className="btn bt-sm bg-success text-white" 
                        onClick={this.refundLoyaltyPoints.bind(this)}>Refund</button>
                    </Panel>
                </div>
            </div>
            <div className="row">
                <div className="col-sm">
                    <Panel title="Available flights">
                        <p>
                        {this.state.flights.map((flight, i) => {
                            return <div key={i}>
                                        <span>{flight.name} - cost: {this.toEther(flight.price)}</span>
                                        <button className="btn btn-sm btn-success text-white" onClick={() => this.buyFlight(i,flight)}>Purchase</button>
                                    </div>
                        })}
                        </p>
                        
                    </Panel>
                </div>
                <div className="col-sm">
                    <Panel title="Your flights">
                        {this.state.customerFlights.map((flight,i) => {
                            return <div key={i}>
                                {flight.name} - cost: {flight.price}
                            </div>
                        })}
                    </Panel>
                </div>
            </div>
        </React.Fragment>
    }
}