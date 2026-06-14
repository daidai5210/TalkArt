function drawStep(THREE, scene) {
  // 左边胡须 1
  const leftWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker1.position.set(-55, 28, 0.3);
  leftWhisker1.rotation.z = 0.15;
  scene.add(leftWhisker1);

  // 左边胡须 2
  const leftWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker2.position.set(-55, 15, 0.3);
  leftWhisker2.rotation.z = -0.15;
  scene.add(leftWhisker2);

  // 右边胡须 1
  const rightWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker1.position.set(55, 28, 0.3);
  rightWhisker1.rotation.z = -0.15;
  scene.add(rightWhisker1);

  // 右边胡须 2
  const rightWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker2.position.set(55, 15, 0.3);
  rightWhisker2.rotation.z = 0.15;
  scene.add(rightWhisker2);

  // 左脸蛋 - 粉色小圆
  const leftBlush = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  leftBlush.position.set(-38, 12, 0.25);
  scene.add(leftBlush);

  // 右脸蛋 - 粉色小圆
  const rightBlush = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  rightBlush.position.set(38, 12, 0.25);
  scene.add(rightBlush);
}