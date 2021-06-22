
import { _decorator, Component, Node, Vec3, RigidBodyComponent, EPSILON, ColliderComponent, ICollisionEvent, CameraComponent, IContactEquation, Collider } from 'cc';
const { ccclass, property } = _decorator;
const _v3_0 = new Vec3();
class ContactPoint {
    point = new Vec3();
    normal = new Vec3();
    collider!: Collider;
    assign (ce: IContactEquation, c: Collider) {
        if (ce.isBodyA) {
            ce.getWorldNormalOnB(this.normal);
            ce.getWorldPointOnA(this.point);
        } else {
            (ce as any).getWorldNormalOnA(this.normal);
            ce.getWorldPointOnB(this.point);
        }
        this.collider = c;
        return this;
    }
}

const _ctPool: ContactPoint[] = [];
class ContactPool {
    static getContacts (ces: IContactEquation[], c: Collider, cps: ContactPoint[]) {
        for (let i = 0; i < ces.length; i++) {
            cps.push(this.getContact(ces[i], c));
        }
    }
    static getContact (ce: IContactEquation, c: Collider): ContactPoint {
        const cp = _ctPool.length > 0 ? _ctPool.pop()! : new ContactPoint();
        return cp.assign(ce, c);
    }
    static recyContacts (cps: ContactPoint[]) {
        Array.prototype.push.call(_ctPool, ...cps);
        cps.length = 0;
    }
}
@ccclass('RigidCharacter')
export class RigidCharacter extends Component {
    @property({type: CameraComponent})
    camera : CameraComponent= null!;

    @property
    maxSpeed = 5;

    @property
    damping = 0.5;

    @property
    slopeLimit = 30;

    @property
    gravity = -20;

    _rigidBody: RigidBodyComponent = null!;
    _collider: ColliderComponent = null!;
    _grounded = true;
    _toSteep = false;
    _contacts: ContactPoint[] = [];
    _groundContact: ContactPoint = null!;
    _groundNormal = Vec3.UP.clone();


    _initTargetPosition: Vec3 = new Vec3();
    _initCameraPosition: Vec3 = new Vec3();
    _altitudeDiff: number = 0;
    

    _velocity = new Vec3();
    get velocity () { return this._velocity; }
    get onGround () { return this._grounded; }


    start () {
        this._rigidBody = this.getComponent(RigidBodyComponent)!;
        this._collider = this.getComponent(ColliderComponent)!;
        this._collider.on('onCollisionEnter', this.onCollision, this);
        this._collider.on('onCollisionStay', this.onCollision, this);
        this._collider.on('onCollisionExit', this.onCollision, this);
        this._initCameraPosition = this.camera.node.getPosition();
        this._initTargetPosition = this.node.getPosition();
    }

    move (dir: Vec3, speed: number) {
        this._rigidBody.getLinearVelocity(_v3_0);
        // console.log('getLinearVelocity1' + _v3_0);
        Vec3.scaleAndAdd(_v3_0, _v3_0, dir, speed);

        const ms = this.maxSpeed;
        const len = _v3_0.lengthSqr();
        if (len > ms) {
            _v3_0.normalize();
            _v3_0.multiplyScalar(ms);
        }

        // let v = this._groundNormal;
        // v.negative();
        // Vec3.scaleAndAdd(_v3_0, _v3_0, v, 1);

        // // //修正y轴速度
        // if(this._altitudeDiff < 0.2) {
        //     _v3_0.y = 0;
        // }
        // _v3_0.y = Math.round(_v3_0.y * 10)/10;
        //修正x轴速度
        // let x = Math.round(dir.x * 100000)/10000000;
        // if (x == 0.0) {
        //     _v3_0.x = 0;
        // }
        // console.log('setLinearVelocity1:' + _v3_0  + ": " + this._altitudeDiff + ":" + v);
        this._rigidBody.setLinearVelocity(_v3_0);
    }

    updateFunction (dt: number) {
        this.updateContactInfo();
        this.applyGravity();
        this.applyDamping();
        this.saveState();
    }

    applyDamping (dt = 1 / 60) {
        this._rigidBody.getLinearVelocity(_v3_0);
        // console.log('getLinearVelocity2' + _v3_0);
        // let y = _v3_0.y;
        // _v3_0.y = 0;
        if (_v3_0.lengthSqr() > EPSILON) {
            _v3_0.multiplyScalar(Math.pow(1.0 - this.damping, dt));
            // // //修正y轴速度
            // if(this._altitudeDiff < 0.2) {
            //     y = 0;
            // }
            // _v3_0.y = y;
            // console.log('setLinearVelocity2' + _v3_0);
            this._rigidBody.setLinearVelocity(_v3_0);
        }
    }

    applyGravity () {
        const g = this.gravity;
        const m = this._rigidBody.mass;
        _v3_0.set(0, m * g, 0);
        // if(this._altitudeDiff < 0.1) {
        //     _v3_0.multiplyScalar(0.1);
        // } else {
        //     _v3_0.multiplyScalar(2);
        // }
        this._rigidBody.applyForce(_v3_0)

    }

    saveState () {
        this._rigidBody.getLinearVelocity(this._velocity);
        // console.log('getLinearVelocity3' + this._velocity  + ":" + this._grounded);
    }

    updateContactInfo () {
        this._grounded = false;
        this._groundContact = null!;
        const wp = this.node.worldPosition;
        let maxY = -0.001;
        for (let i = 0; i < this._contacts.length; i++) {
            const c = this._contacts[i];
            const n = c.normal, p = c.point;
            if (n.y <= 0.0001) continue;
            else {
                if (n.y > maxY && p.y > wp.y - 0.1) {
                    this._grounded = true;
                    maxY = n.y;
                    this._groundContact = c;
                }
            }
        }
        if (this._grounded) {
            Vec3.copy(this._groundNormal, this._groundContact.normal);
            this._toSteep = this._groundContact.normal.y <= Math.cos(this.slopeLimit * Math.PI / 180);
        } else {
            Vec3.copy(this._groundNormal, Vec3.UP);
            this._toSteep = false;
        }
        ContactPool.recyContacts(this._contacts);
    }

    onCollision (event: ICollisionEvent) {
        // console.log('onCollision' + event.selfCollider.node.getPosition());
        let currentTargetPosition = event.selfCollider.node.getPosition();
        let y = currentTargetPosition.y - this._initTargetPosition.y;
        this._altitudeDiff = y;
        // console.log('this._altitudeDiff' + this._altitudeDiff + ': ' + this.node.getPosition());
        y = this._initCameraPosition.y + Math.sin(y)* 3;
        let z = this._initCameraPosition.z - Math.cos(y) * 3;

        // y = Math.round(y * 10)/10;
        // z = Math.round(z * 10)/10;
        let pos = this.camera.node.getPosition();
        this.camera.node.setPosition(this._initCameraPosition.x, y, z);
        this.camera.node.lookAt(this.node.getPosition());
        // console.log('camera' + this.camera.node.getPosition());
        ContactPool.getContacts(event.contacts, event.selfCollider, this._contacts);

    }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
