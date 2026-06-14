function drawStep(THREE, scene) {
  // 小狗的圆圆脑袋 - 黑色外轮廓
  const headOutline = new THREE.Mesh(
    new THREE.CircleGeometry(68),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  headOutline.position.set(0, 70, 0);
  scene.add(headOutline);

  // 小狗的圆圆脑袋 - 浅黄色填充
  const head = new THREE.Mesh(
    new THREE.CircleGeometry(62),
    new THREE.MeshBasicMaterial({ color: '#fff7df' })
  );
  head.position.set(0, 70, 1);
  scene.add(head);

  // 左边软软的耳朵 - 黑色外轮廓
  const leftEarOutline = new THREE.Mesh(
    new THREE.CircleGeometry(34),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftEarOutline.scale.set(0.75, 1.25, 1);
  leftEarOutline.position.set(-62, 72, 0);
  scene.add(leftEarOutline);

  // 左耳朵填充
  const leftEar = new THREE.Mesh(
    new THREE.CircleGeometry(29),
    new THREE.MeshBasicMaterial({ color: '#d58b55' })
  );
  leftEar.scale.set(0.75, 1.25, 1);
  leftEar.position.set(-62, 72, 1);
  scene.add(leftEar);

  // 右边软软的耳朵 - 黑色外轮廓
  const rightEarOutline = new THREE.Mesh(
    new THREE.CircleGeometry(34),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightEarOutline.scale.set(0.75, 1.25, 1);
  rightEarOutline.position.set(62, 72, 0);
  scene.add(rightEarOutline);

  // 右耳朵填充
  const rightEar = new THREE.Mesh(
    new THREE.CircleGeometry(29),
    new THREE.MeshBasicMaterial({ color: '#d58b55' })
  );
  rightEar.scale.set(0.75, 1.25, 1);
  rightEar.position.set(62, 72, 1);
  scene.add(rightEar);
}