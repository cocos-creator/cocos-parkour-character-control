
import { _decorator, Component, Node, Collider, ITriggerEvent, Vec3, Prefab, instantiate } from 'cc';
import { Wall } from './wall';
const { ccclass, property } = _decorator;

@ccclass('TriggerArea')
export class TriggerArea extends Component {
    @property(Wall) 
    wallScript: Wall = null!;

    start() {
        const collider = this.getComponent(Collider);
        collider?.on('onTriggerEnter', (event: ITriggerEvent) => {
            const p2 = event.otherCollider.node.worldPosition;
            event.otherCollider.node.worldPosition = new Vec3(p2.x, p2.y + 2, 2);
            event.otherCollider.attachedRigidBody!.clearState();
            if (this.wallScript) this.wallScript.createWall();
        })
    }
}
