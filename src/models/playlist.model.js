import mongoose , {Schema} from "mongoose"

const playlistSchema= new Schema({
    name:{
        type:String,
        required:true
    },
    description:[{
        type: string,
        required: true
    },
    videos 
        {
            type: schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }

},
{timestamp: true}
)