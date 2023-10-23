export const ReturnPoints = (bezier:string) => {
  let split_data:string[] = bezier.split(',');
  return ({
    'p1': {'x':parseFloat(split_data[0].replace("cubic-bezier(", "")), 'y': parseFloat(split_data[1])},
    'p2': {'x':parseFloat(split_data[2]), 'y': parseFloat(split_data[3].replace(")", ""))}
  })
}

export const ReturnLinearPoints = (linear:string) => {
  let split_dataset:String[] = linear.split(',');
  let points = [];
  for (let i = 0; i < split_dataset.length; i++) {
    let data = split_dataset[i].trim().split(" ");
    points.push({x: parseFloat(data[1].replace(")", "").replace('%', '')) * 0.01, y: parseFloat(data[0].replace("linear(", ""))})
  }

  return points
}