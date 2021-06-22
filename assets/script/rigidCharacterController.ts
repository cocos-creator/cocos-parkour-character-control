
import { _decorator, Component, Node, Vec2, Vec3, Quat, clamp, systemEvent, SystemEventType, Touch, ColliderComponent } from 'cc';
import { RigidCharacter } from './rigidCharacter';
const { ccclass, property } = _decorator;
const v3_0 = new Vec3();
const quat_0 = new Quat();

@ccclass('RigidCharacterController')
export class RigidCharactorController extends Component {
    @property(RigidCharacter)
    character: RigidCharacter = null!;

    @property({ type: Node })
    currentOrient: Node = null!;

    @property({ type: Node })
    targetOrient: Node = null!;

    @property
    rotateFactor = 0.1;

    @property({ type: Vec3 })
    speed: Vec3 = new Vec3(1, 0, 1);

    protected _stateX: number = 0;  // 1 positive, 0 static, -1 negative
    protected _stateZ: number = 0;
    protected _speed = 0;
    _collider: ColliderComponent = null!;

    start () {
        this._collider = this.getComponent(ColliderComponent)!;
        // this._collider.on('onCollisionEnter', this.onCollision, this);
        // this._collider.on('onCollisionStay', this.onCollision, this);
        // this._collider.on('onCollisionExit', this.onCollision, this);
    }

    update (dtS: number) {
        const dt = 1000 / 60;
        this.updateCharacter(dt);
    }

    onEnable () {
        systemEvent.on(SystemEventType.TOUCH_START, this.touchStart, this);
        systemEvent.on(SystemEventType.TOUCH_MOVE, this.touchMove, this);
        systemEvent.on(SystemEventType.TOUCH_END, this.touchEnd, this);
        systemEvent.on(SystemEventType.TOUCH_CANCEL, this.touchCancel, this);

    } 

    onDisable () {
        systemEvent.off(SystemEventType.TOUCH_START, this.touchStart, this);
        systemEvent.off(SystemEventType.TOUCH_MOVE, this.touchMove, this);
        systemEvent.off(SystemEventType.TOUCH_END, this.touchEnd, this);
        systemEvent.off(SystemEventType.TOUCH_CANCEL, this.touchCancel, this);

    }

    touchStart (touch: Touch) {
        this._stateX = 0;
    }

    touchMove (touch: Touch) {
        let x = touch.getUIDelta().x;
        if (x > 0) {
            this._stateX = this.speed.x;  
        } else {
            this._stateX = -this.speed.x;
        }
    }

    touchEnd (touch: Touch) {
        this._stateX = 0;
    }

    touchCancel (touch: Touch) {
        this._stateX = 0;
    }

    updateCharacter (dt: number) {
        this.character.updateFunction(dt);

        // rotate
        const qm = this.currentOrient.rotation;
        const qf = this.targetOrient.rotation;
        if (!Quat.equals(qm, qf)) {
            Quat.slerp(quat_0, qm, qf, this.rotateFactor);
            this.currentOrient.worldRotation = quat_0;
        }

        
        // move
        this._stateZ = this.speed.z;
        if (!this.character.onGround) return;
        if (this._stateX || this._stateZ) {
            v3_0.set(this._stateX, 0, this._stateZ);
            v3_0.normalize();
            // v3_0.negative();
            // this.targetOrient.forward = v3_0;
            // v3_0.set(this.currentOrient.forward);
            // v3_0.negative();
            // const qm = this.currentOrient.rotation;
            // const qf = this.targetOrient.rotation;
            // const rs = clamp(this.rotationScalar(qm, qf), 0, 1);
            // v3_0.x = Math.abs(v3_0.x) < 1e-7 ? 0 : v3_0.x;
            this.character.move(v3_0, 1);
        }
    }

    rotationScalar (a: Quat, b: Quat) {
        const cosom = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
        return cosom;
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
