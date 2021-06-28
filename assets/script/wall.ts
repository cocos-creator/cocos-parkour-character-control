
import { _decorator, Component, Node, RigidBodyComponent, ColliderComponent, ITriggerEvent, ICollisionEvent, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Wall')
export class Wall extends Component {
    // [1]
    // dummy = '';
    @property(Prefab)
    wallPrefab: Prefab = null!;

    @property(Node)
    wallNode: Node = null!;

    // [2]
    @property
    mass = 1;

    @property
    linearDamping = 0.1;

    @property
    angularDamping = 0.1;

    start () {
        // [3]
        this.createWall();
    }

    _onTriggerEnter(event?:ITriggerEvent) {
        let other = event?.otherCollider;
        if (other?.node.name.indexOf('target') === -1) return;
        let rArr =  this.node.getComponentsInChildren(RigidBodyComponent);
        rArr.forEach((value: RigidBodyComponent) => {
            // value.wakeUp();
            value.useGravity = true;
        });
    }

    createWall () {
        if (this.wallNode.children.length) {
            this.wallNode.removeAllChildren();
        }

        let node = instantiate(this.wallPrefab);
        this.wallNode.addChild(node);
        let rArr =  node.getComponentsInChildren(RigidBodyComponent);
        rArr.forEach((value: RigidBodyComponent) => {
            value.mass = this.mass;
            value.linearDamping = this.linearDamping;
            value.angularDamping = this.angularDamping;
            // value.sleep();
            value.useGravity = false;
            
            
        });

        let collider = node.getComponent(ColliderComponent);
        collider?.on('onTriggerEnter', this._onTriggerEnter, this);
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
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
