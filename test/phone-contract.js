/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { PhoneContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('PhoneContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new PhoneContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"phone 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"phone 1002 value"}'));
    });

    describe('#phoneExists', () => {

        it('should return true for a phone', async () => {
            await contract.phoneExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a phone that does not exist', async () => {
            await contract.phoneExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createPhone', () => {

        it('should create a phone', async () => {
            await contract.createPhone(ctx, '1003', 'phone 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"phone 1003 value"}'));
        });

        it('should throw an error for a phone that already exists', async () => {
            await contract.createPhone(ctx, '1001', 'myvalue').should.be.rejectedWith(/The phone 1001 already exists/);
        });

    });

    describe('#readPhone', () => {

        it('should return a phone', async () => {
            await contract.readPhone(ctx, '1001').should.eventually.deep.equal({ value: 'phone 1001 value' });
        });

        it('should throw an error for a phone that does not exist', async () => {
            await contract.readPhone(ctx, '1003').should.be.rejectedWith(/The phone 1003 does not exist/);
        });

    });

    describe('#updatePhone', () => {

        it('should update a phone', async () => {
            await contract.updatePhone(ctx, '1001', 'phone 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"phone 1001 new value"}'));
        });

        it('should throw an error for a phone that does not exist', async () => {
            await contract.updatePhone(ctx, '1003', 'phone 1003 new value').should.be.rejectedWith(/The phone 1003 does not exist/);
        });

    });

    describe('#deletePhone', () => {

        it('should delete a phone', async () => {
            await contract.deletePhone(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a phone that does not exist', async () => {
            await contract.deletePhone(ctx, '1003').should.be.rejectedWith(/The phone 1003 does not exist/);
        });

    });

});