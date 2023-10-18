export default () => {
  const ReturnPoints = (bezier:string) => {
    let split_data:string[] = bezier.split(',');
    return ({
      'p1': {'x':parseFloat(split_data[0].replace("cubic-bezier(", "")), 'y': parseFloat(split_data[1])},
      'p2': {'x':parseFloat(split_data[2]), 'y': parseFloat(split_data[3].replace(")", ""))}
    })
  }
  return { ReturnPoints };
}
