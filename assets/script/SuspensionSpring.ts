
import { _decorator, Component, Node, PhysicsSystem, Vec3, director, Director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SuspensionSpring')
export class SuspensionSpring extends Component {

    @property(Node)
    connect: Node = null!;

    @property
    constant = 1;

    @property
    threshold = 1e-3;

    start() {
        director.on(Director.EVENT_AFTER_PHYSICS, this.spring, this);
    }

    spring() {
        const dt = PhysicsSystem.instance.fixedTimeStep;
        const pos = this.node.worldPosition;
        const cpos = this.connect.worldPosition;
        const dy = cpos.y - pos.y;
        if (Math.abs(dy) > this.threshold) {
            const f = dy * this.constant;
            const y = pos.y + f * dt * dt / 2;
            this.node.worldPosition = new Vec3(cpos.x, y, cpos.z);
        } else {
            this.node.worldPosition = cpos;
        }
    }
}
