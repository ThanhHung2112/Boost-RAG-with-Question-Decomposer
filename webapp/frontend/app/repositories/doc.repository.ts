import { DocModel } from "../models";

import { BaseRepository } from "./base.repository";

class DocRepository extends BaseRepository<DocModel> {
  constructor() {
    super(DocModel);
  }
}

export const docRepository = new DocRepository();
